import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { CardEvidence, Organization } from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { uploadFileToS3, deleteFileFromS3 } from '../service/s3';
import multer from 'multer';
import logger from '../config/winston';
const upload = multer({ dest: 'uploads/' });
import fs from 'fs';
import { findRequestedOrganization } from '../middleware/auth';

export function createCardEvidenceRouter() {
    const router = express.Router();
    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        validateOrganization,
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const cardEvidences = await CardEvidence.findAll({
                where: {
                    organizationId: req.params.organization_id,
                    year: req.params.year,
                    half: req.params.half,
                },
            });
            res.json(cardEvidences).status(200);
        }),
    );

    router.post(
        '/:organization_id/:year/:half',
        validateOrganization,
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                throw new BadRequestError('No file attached');
            }

            const organization = await Organization.findOne({
                where: {
                    id: req.params.organization_id,
                },
            });

            if (!organization) {
                throw new BadRequestError('No such organization');
            }
            logger.info('parameter checked');
            const key = `${organization.id}/${req.params.year}/${req.params.half}/card_evidences/${req.file.filename}`;

            const uploadResponse = await uploadFileToS3(key, req.file.path);
            if (uploadResponse.statusCode !== 200) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to upload file to S3',
                };
                res.json(ret);
            }
            logger.info('upload to s3 success');
            await CardEvidence.create({
                organizationId: req.params.organization_id,
                year: req.params.year,
                half: req.params.half,
                key: key,
            });

            const ret = {
                statusCode: 200,
                message: 'Uploaded CardEvidence successfully',
            };
            logger.info('create card evidence success');
            res.json(ret).status(200);
        }),
    );

    router.put(
        '/:organization/:card_evidence_id',
        validateOrganization,
        upload.single('file'),
        wrapAsync(
            async (req: Request, res: Response, next: NextFunction) => {},
        ),
    );

    router.delete(
        '/:organizationId/:card_evidence_id',
        validateOrganization,
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const key = await CardEvidence.findOne({
                where: {
                    id: req.params.card_evidence_id,
                },
            }).then((cardEvidence) => {
                if (!cardEvidence) {
                    throw new BadRequestError('No such card evidence');
                }
                return cardEvidence.key;
            });

            const deleteResponse = await deleteFileFromS3(key);
            if (deleteResponse.statusCode !== 200) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to delete file from S3',
                };
                res.json(ret);
            }

            await CardEvidence.destroy({
                where: {
                    id: req.params.card_evidence_id,
                },
            });

            const ret = {
                statusCode: 200,
                message: 'Deleted CardEvidence successfully',
            };

            res.json(ret);
        }),
    );
    return router;
}
