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
        '/:organizationId/:transactionId',
        validateOrganization,
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                const ret = {
                    statusCode: 400,
                    message: 'No file was uploaded',
                };
                res.json(ret);
                return ret;
            }
            logger.info('got file: ', req.file);
            // TODO: transaction 존재 여부 확인, audit_year, audit_half_period 추출 로직을 서비스로 분리.

            let audit_year = null;
            let audit_half_period = null;
            try {
                const transaction = await Transaction.findOne({
                    where: {
                        id: req.params.transactionId,
                    },
                });

                if (!transaction) {
                    throw new BadRequestError(
                        'Failed to find Transaction to upload',
                    );
                }

                if (transaction.IncomeId) {
                    const income = await Income.findOne({
                        where: {
                            id: transaction.IncomeId,
                        },
                    });
                    let budget = await Budget.findOne({
                        where: {
                            id: income?.BudgetId,
                        },
                    });
                    audit_year = budget?.year;
                    audit_half_period = budget?.half;
                } else if (transaction.ExpenseId) {
                    const expense = await Expense.findOne({
                        where: {
                            id: transaction.ExpenseId,
                        },
                    });
                    let budget = await Budget.findOne({
                        where: {
                            id: expense?.BudgetId,
                        },
                    });
                    audit_year = budget?.year;
                    audit_half_period = budget?.half;
                } else {
                    throw new BadRequestError(
                        'Failed to find Income or Expense to upload',
                    );
                }
            } catch (error) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to find Transaction to upload',
                };
                res.json(ret);
                return ret;
            }

            const fileKey = `${req.params.organizationId}/${audit_year}/${audit_half_period}/transaction_records/${req.params.transactionId}/${req.file.filename}`;
            // TODO: 중복 확인
            const uploadResponse = await uploadFileToS3(req.file.path, fileKey);
            if (uploadResponse.statusCode !== 200) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to upload file to S3',
                };
                res.json(ret);
            }

            fs.unlinkSync(req.file.path);

            // const URI = uploadResponse.uri;
            const transactionRecord = await TransactionRecord.create({
                transactionId: req.params.transactionId,
                key: fileKey,
                note: req.body.memo,
            });
            const ret = {
                statusCode: 200,
                message: 'upload success',
                TransactionRecord: transactionRecord,
            };
            res.json(ret);
        }),
    );

    router.put(
        '/:organization/:transaction_record_id',
        validateOrganization,
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            if (req.file) {
                const audit_year = '2024'; // TODO: get audit year dynamically
                const audit_half_period = 'Spring'; // TODO: get audit half period dynamically, ENUM 타입으로 바꾸기
                const fileKey = `${req.params.organization}/${audit_year}/${audit_half_period}/transaction_records/${req.params.transaction_id}/${req.file.filename}`;
                // TODO: 중복 확인
                const uploadResponse = await uploadFileToS3(
                    req.file.path,
                    fileKey,
                );
                if (uploadResponse.statusCode !== 200) {
                    const ret = {
                        statusCode: 400,
                        message: 'Failed to upload file to S3',
                    };
                    res.json(ret);
                }
                fs.unlinkSync(req.file.path);
                // const URI = uploadResponse.uri;
                const originalKey = await TransactionRecord.findOne({
                    where: {
                        id: req.params.transaction_record_id,
                    },
                }).then((transactionRecord) => {
                    return transactionRecord?.key;
                });
                if (!originalKey) {
                    const ret = {
                        statusCode: 400,
                        message: 'Failed to find TransactionRecord to update',
                    };
                    res.json(ret);
                    return ret;
                }

                await TransactionRecord.update(
                    {
                        key: fileKey,
                        note: req.body.memo,
                    },
                    {
                        where: {
                            id: req.params.transaction_record_id,
                        },
                    },
                );

                const deleteResponse = await deleteFileFromS3(originalKey);
                if (deleteResponse.statusCode !== 200) {
                    const ret = {
                        statusCode: 400,
                        message: 'Failed to delete file from S3',
                    };
                    res.json(ret);
                } // TODO: Error handling properly.

                const ret = {
                    statusCode: 200,
                    message:
                        'Updated TransactionRecord successfully with new file',
                };
                res.json(ret);
            } else {
                // No file was uploaded. Only update the memo.
                try {
                    await TransactionRecord.update(
                        {
                            note: req.body.memo,
                        },
                        {
                            where: {
                                id: req.params.transaction_record_id,
                            },
                        },
                    );
                    res.sendStatus(200);
                } catch (error) {
                    const ret = {
                        statusCode: 400,
                        message: 'Failed to update TransactionRecord',
                    };
                    res.json(ret);
                }
            }
        }),
    );

    router.delete(
        '/:organizationId/:transaction_record_id',
        validateOrganization,
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            try {
                const key = await TransactionRecord.findOne({
                    where: {
                        id: req.params.transaction_record_id,
                    },
                }).then((TransactionRecord) => {
                    return TransactionRecord?.key;
                });

                if (!key) {
                    throw new BadRequestError(
                        'Failed to find TransactionRecord to delete',
                    );
                }

                const deleteResponse = await deleteFileFromS3(key);
                if (deleteResponse.statusCode !== 200) {
                    throw new BadRequestError('Failed to delete file from S3'); // TODO: Error handling properly.
                }
                await TransactionRecord.destroy({
                    where: {
                        id: req.params.transaction_record_id,
                    },
                });
                res.sendStatus(200);
            } catch (error) {
                const ret = {
                    statusCode: 400,
                    message: 'Failed to find TransactionRecord to delete',
                };
                res.json(ret);
                return ret;
            }
        }),
    );
    return router;
}
