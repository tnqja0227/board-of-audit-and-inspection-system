import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { ExpenseRecord } from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { uploadFileToS3, deleteFileFromS3 } from '../service/s3';
import multer from 'multer';
import logger from '../config/winston';
const upload = multer({ dest: 'uploads/' });
import fs from 'fs';
import { findRequestedOrganization } from '../middleware/auth';

export function createExpenseRecordsRouter() {
    const router = express.Router();
    // router.use(wrapAsync(validateOrganization));
    router.post(
        '/test',
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                const ret = {
                    statusCode: 400,
                    message: 'No file was uploaded to the server',
                };
                res.json(ret);
                return;
            }

            logger.info('got file: ', req.file);
            const organization = 'test_org_1'; // test
            const audit_year = '2024'; // TODO: get audit year dynamically
            const audit_half_period = 'Spring'; // TODO: get audit half period dynamically
            const fileKey = `${organization}/${audit_year}/${audit_half_period}/expense_records/${req.file.filename}`;

            const uploadResponse = await uploadFileToS3(req.file.path, fileKey);
            // if (uploadResponse.statusCode !== 200) {
            //     throw new BadRequestError('Failed to upload file to S3');
            // }
            // logger.info('uploadResponse: ', uploadResponse);
            fs.unlinkSync(req.file.path);

            // delete test
            logger.info('deleting file: ', fileKey);
            const deleteResponse = await deleteFileFromS3(fileKey);
            if (deleteResponse.statusCode !== 200) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to delete file from S3',
                };
                res.json(ret);
            }
            const ret = {
                statusCode: 200,
                message: 'upload and delete success',
            };
            res.sendStatus(200);
        }),
    );

    router.post(
        ':organization/:transaction_id',
        // validateOrganization,
        upload.single('file'),
        async (req, res, next) => {
            wrapAsync(
                async (req: Request, res: Response, next: NextFunction) => {
                    if (!req.file) {
                        const ret = {
                            statusCode: 400,
                            message: 'No file was uploaded',
                        };
                        res.json(ret);
                        next();
                        return;
                    }
                    // TODO: transaction_id validation
                    const organization = req.params.organization;
                    const audit_year = '2024'; // TODO: get audit year dynamically
                    const audit_half_period = 'Spring'; // TODO: get audit half period dynamically
                    const fileKey = `${organization}/${audit_year}/${audit_half_period}/expense_records/${req.params.transaction_id}/${req.file.filename}`;
                    // TODO: 중복 확인
                    const uploadResponse = await uploadFileToS3(
                        req.file.path,
                        fileKey,
                    );
                    if (uploadResponse.statusCode !== 200) {
                        throw new BadRequestError(
                            'Failed to upload file to S3',
                        ); // TODO: error handling
                    }

                    fs.unlinkSync(req.file.path);
                    const URI = uploadResponse.uri;
                    const expenseRecord = await ExpenseRecord.create({
                        transactionId: req.params.transaction_id,
                        key: fileKey,
                        note: req.body.memo,
                    });
                    res.sendStatus(200);
                },
            );
        },
    );

    // router.put(
    //     '/:expense_record_id',
    //     validateOrganization,
    //     upload.single('file'),
    //     async (req, res, next) => {
    //         wrapAsync(
    //             async (req: Request, res: Response, next: NextFunction) => {
    //                 if (req.file) {
    //                     const organization = await findRequestedOrganization(
    //                         req,
    //                     );
    //                     const audit_year = '2024'; // TODO: get audit year dynamically
    //                     const audit_half_period = 'Spring'; // TODO: get audit half period dynamically
    //                     const fileKey = `${organization}%2F${audit_year}%2F${audit_half_period}%2Fexpense_records%2F${req.params.transaction_id}%2F${req.file.filename}`;
    //                     // TODO: 중복 확인
    //                     const uploadResponse = await uploadFileToS3(
    //                         req.file.path,
    //                         fileKey,
    //                     );
    //                     if (uploadResponse.statusCode !== 200) {
    //                         throw new BadRequestError(
    //                             'Failed to upload file to S3',
    //                         );
    //                     }
    //                     fs.unlinkSync(req.file.path);
    //                     const URI = uploadResponse.uri;
    //                     const originalKey = await ExpenseRecord.findOne({
    //                         where: {
    //                             id: req.params.expense_record_id,
    //                         },
    //                     }).then((expenseRecord) => {
    //                         return expenseRecord?.key;
    //                     });
    //                     if (!originalKey) {
    //                         throw new BadRequestError(
    //                             'Failed to find original object',
    //                         );
    //                     } // TODO: error handling properly.

    //                     await ExpenseRecord.update(
    //                         {
    //                             key: fileKey,
    //                             note: req.body.memo,
    //                         },
    //                         {
    //                             where: {
    //                                 id: req.params.expense_record_id,
    //                             },
    //                         },
    //                     );

    //                     const deleteResponse = await deleteFileFromS3(
    //                         originalKey,
    //                     );
    //                     if (deleteResponse.statusCode !== 200) {
    //                         throw new BadRequestError(
    //                             'Failed to delete file from S3',
    //                         );
    //                     } // TODO: Error handling properly.

    //                     res.sendStatus(200);
    //                 }

    //                 // No file was uploaded. Only update the memo.
    //                 await ExpenseRecord.update(
    //                     {
    //                         note: req.body.memo,
    //                     },
    //                     {
    //                         where: {
    //                             id: req.params.expense_record_id,
    //                         },
    //                     },
    //                 );
    //                 res.sendStatus(200);
    //             },
    //         );
    //     },
    // );

    // router.delete(
    //     '/:expense_record_id',
    //     validateOrganization,
    //     async (req, res, next) => {
    //         wrapAsync(
    //             async (req: Request, res: Response, next: NextFunction) => {
    //                 const URI = await ExpenseRecord.findOne({
    //                     where: {
    //                         id: req.params.expense_record_id,
    //                     },
    //                 }).then((expenseRecord) => {
    //                     return expenseRecord?.key;
    //                 });
    //                 if (!URI) {
    //                     throw new BadRequestError('Failed to find URL');
    //                 } // TODO: error handling properly.

    //                 const deleteResponse = await deleteFileFromS3(URI);
    //                 if (deleteResponse.statusCode !== 200) {
    //                     throw new BadRequestError(
    //                         'Failed to delete file from S3',
    //                     ); // TODO: Error handling properly.
    //                 }
    //                 await ExpenseRecord.destroy({
    //                     where: {
    //                         id: req.params.expense_record_id,
    //                     },
    //                 });
    //                 res.sendStatus(200);
    //             },
    //         );
    //     },
    // );

    return router;
}
