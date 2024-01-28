import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { AccountRecord, Organization, Account } from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { uploadFileToS3, deleteFileFromS3 } from '../service/s3';
import multer from 'multer';
import logger from '../config/winston';
const upload = multer({ dest: 'uploads/' });
import fs from 'fs';

export function createAccountRecordRouter() {
    const router = express.Router();
    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:account_id',
        validateOrganization,
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const accountRecord = await AccountRecord.findAll({
                where: {
                    accountId: req.params.account_id,
                },
            });

            res.json(accountRecord).status(200);
        }),
    );

    router.post(
        '/:organization_id/:account_id',
        validateOrganization,
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                const ret = {
                    statusCode: 400,
                    message: 'No file attached',
                };
                res.json(ret).status(400);
                return ret;
            }

            const organization = await Organization.findOne({
                where: {
                    id: req.params.organization_id,
                },
            });
            if (!organization) {
                const ret = {
                    statusCode: 400,
                    message: 'No such organization',
                };
                res.json(ret).status(400);
                return ret;
            }
            const account = await Account.findOne({
                where: {
                    id: req.params.account_id,
                },
            });
            if (!account) {
                const ret = {
                    statusCode: 400,
                    message: 'No such account',
                };
                res.json(ret).status(400);
                return ret;
            }
            const key = `${organization.id}/${account.year}/${account.half}/account_records/${req.params.account_id}/${req.file.filename}`;

            const uploadResponse = await uploadFileToS3(key, req.file.path);
            if (uploadResponse.statusCode !== 200) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to upload file to S3',
                };
                res.json(ret);
                return ret;
            }
            await AccountRecord.create({
                accountId: req.params.account_id,
                key: key,
                note: req.body.note,
            });

            const ret = {
                statusCode: 200,
                message: 'Uploaded AccountRecord successfully',
            };
            res.json(ret);
        }),
    );

    router.delete(
        '/:organization_id/:account_record_id',
        validateOrganization,
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const accountRecord = await AccountRecord.findOne({
                where: {
                    id: req.params.account_record_id,
                },
            });
            if (!accountRecord) {
                const ret = {
                    statusCode: 400,
                    message: 'No such account record',
                };
                res.json(ret).status(400);
                return ret;
            }
            const s3ret = await deleteFileFromS3(accountRecord.key);
            if (s3ret.statusCode !== 200) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to delete file from S3',
                };
                res.json(ret).status(400);
                return ret;
            }
            await accountRecord.destroy();
            const ret = {
                statusCode: 200,
                message: 'Deleted AccountRecord successfully',
            };
            res.json(ret).status(200);
        }),
    );

    return router;
}
