import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { AccountRecord, Organization, Account } from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { upload } from '../config/multer';
import logger from '../config/winston';
import { BadGatewayError, NotFoundError } from '../utils/errors';
import { deleteFileFromS3, s3keyToUri, uploadFileToS3 } from '../config/s3';

// TODO: split this into multiple layers
export function createAccountRecordRouter() {
    const router = express.Router();

    router.get(
        '/:account_id',
        wrapAsync(validateOrganization),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('AccountRecordController: getAccountRecord called');
            const accountRecord = await AccountRecord.findOne({
                where: {
                    AccountId: req.params.account_id,
                },
            });
            if (!accountRecord) {
                throw new NotFoundError(
                    `${req.params.account_id}에 해당하는 통장 입출금 내역 증빙 자료가 존재하지 않습니다.`,
                );
            }

            accountRecord.URI = s3keyToUri(accountRecord.URI);
            res.json(accountRecord).status(200);
        }),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post(
        '/:account_id',
        wrapAsync(validateOrganization),
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('AccountRecordController: createAccountRecord called');

            const account = await Account.findOne({
                where: {
                    id: req.params.account_id,
                },
            });
            if (!account) {
                throw new NotFoundError(
                    `${req.params.account_id}에 해당하는 계좌가 존재하지 않습니다.`,
                );
            }

            const organization = await Organization.findOne({
                where: {
                    id: account.OrganizationId,
                },
            });
            if (!organization) {
                throw new NotFoundError(
                    `${account.OrganizationId}에 해당하는 피감기구가 존재하지 않습니다.`,
                );
            }

            // key in S3 bucket
            const key = `${organization.name}/${account.year}/${
                account.half
            }/account_records/${account.name || account.id}`;

            const uploadResponse = await uploadFileToS3(req.file!, key);
            if (uploadResponse.statusCode !== 200) {
                throw new BadGatewayError(
                    'S3에 파일을 업로드하는데 실패했습니다.',
                );
            }

            const accountRecord = await AccountRecord.create({
                URI: key,
                note: req.body.note,
                AccountId: req.params.account_id,
            });
            res.json(accountRecord);
        }),
    );

    router.delete(
        '/:account_record_id',
        wrapAsync(validateOrganization),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('AccountRecordController: deleteAccountRecord called');

            const accountRecord = await AccountRecord.findByPk(
                req.params.account_record_id,
            );
            if (!accountRecord) {
                throw new NotFoundError(
                    `${req.params.account_record_id}에 해당하는 통장 입출금 내역 증빙 자료가 존재하지 않습니다.`,
                );
            }
            const deleteResponse = await deleteFileFromS3(accountRecord.URI);
            if (deleteResponse.statusCode !== 204) {
                throw new BadGatewayError(
                    'S3에서 파일을 삭제하는데 실패했습니다.',
                );
            }

            await accountRecord.destroy();
            res.sendStatus(200);
        }),
    );

    return router;
}
