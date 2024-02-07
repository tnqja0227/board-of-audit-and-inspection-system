import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { CardRecord, Organization } from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { BadGatewayError, NotFoundError } from '../utils/errors';
import logger from '../config/winston';
import { deleteFileFromS3, s3keyToUri, uploadFileToS3 } from '../config/s3';
import { upload } from '../config/multer';

// TODO: split this into multiple layers
export function createCardRecordRouter() {
    const router = express.Router();

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(validateOrganization),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('CardRecordController: getCardRecords called');
            const cardRecord = await CardRecord.findOne({
                where: {
                    OrganizationId: req.params.organization_id,
                    year: req.params.year,
                    half: req.params.half,
                },
            });
            if (!cardRecord) {
                throw new NotFoundError(
                    `${req.params.organization_id}에 해당하는 카드 증빙 자료가 존재하지 않습니다.`,
                );
            }
            cardRecord.URI = s3keyToUri(cardRecord.URI);
            res.json(cardRecord);
        }),
    );

    router.post(
        '/:organization_id/:year/:half',
        wrapAsync(validateAuditPeriod),
        wrapAsync(validateOrganization),
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('CardRecordController: createCardRecord called');
            const organization = await Organization.findOne({
                where: {
                    id: req.params.organization_id,
                },
            });
            if (!organization) {
                throw new NotFoundError(
                    `${req.params.organization_id}에 해당하는 피감기구가 존재하지 않습니다.`,
                );
            }

            // key in S3 bucket
            const key = `${organization.name}/${req.params.year}/${
                req.params.half
            }/card_records/${req.file!.originalname}`;

            const uploadResponse = await uploadFileToS3(req.file!, key);
            if (uploadResponse.statusCode !== 200) {
                throw new BadGatewayError(
                    'S3에 파일을 업로드하는데 실패했습니다.',
                );
            }

            // upsert
            let cardRecord = await CardRecord.findOne({
                where: {
                    year: req.params.year,
                    half: req.params.half,
                    OrganizationId: req.params.organization_id,
                },
            });
            if (cardRecord) {
                cardRecord.URI = key;
                await cardRecord.save();
            } else {
                cardRecord = await CardRecord.create({
                    year: req.params.year,
                    half: req.params.half,
                    URI: key,
                    OrganizationId: req.params.organization_id,
                });
            }
            cardRecord.URI = s3keyToUri(cardRecord.URI);
            res.json(cardRecord);
        }),
    );

    // TODO: year와 half가 존재하지 않을 경우, validateAuditPeriod에서 현재 기간의 auditPeriod를 찾아서 사용하도록 수정
    router.delete(
        '/:card_record_id',
        // wrapAsync(validateAuditPeriod),
        wrapAsync(validateOrganization),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('CardRecordController: deleteCardEvidence called');

            const cardRecord = await CardRecord.findByPk(
                req.params.card_record_id,
            );
            if (!cardRecord) {
                throw new NotFoundError(
                    `${req.params.card_record_id}에 해당하는 카드 증빙 자료가 존재하지 않습니다.`,
                );
            }

            const deleteResponse = await deleteFileFromS3(cardRecord.URI);
            if (deleteResponse.statusCode !== 204) {
                throw new BadGatewayError(
                    'S3에서 파일을 삭제하는데 실패했습니다.',
                );
            }
            await cardRecord.destroy();
            res.sendStatus(200);
        }),
    );

    return router;
}
