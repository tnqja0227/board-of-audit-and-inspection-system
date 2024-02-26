import express from 'express';
import { Request, Response, NextFunction } from 'express';
import {
    Transaction,
    TransactionRecord,
    Income,
    Expense,
    Budget,
    Organization,
} from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { BadGatewayError, NotFoundError } from '../utils/errors';
import { s3keyToUri, uploadFileToS3 } from '../config/s3';
import logger from '../config/winston';
import { upload } from '../config/multer';

export function createTransactionRecordsRouter() {
    const router = express.Router();

    router.get(
        '/:transaction_id',
        wrapAsync(validateOrganization),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info(
                'TransactionRecordController: getTransactionRecord called',
            );
            const transactionRecords = await TransactionRecord.findAll({
                where: {
                    TransactionId: req.params.transaction_id,
                },
            });
            transactionRecords.forEach((transactionRecord) => {
                transactionRecord.URI = s3keyToUri(transactionRecord.URI);
            });
            res.json(transactionRecords);
        }),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post(
        '/:transaction_id',
        wrapAsync(validateOrganization),
        upload.single('file'),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info(
                'TransactionRecordController: createTransactionRecord called',
            );

            const transaction = await Transaction.findOne({
                where: {
                    id: req.params.transaction_id,
                },
            });
            if (!transaction) {
                throw new NotFoundError(
                    `${req.params.transaction_id}에 해당하는 통장 거래 내역이 존재하지 않습니다.`,
                );
            }

            let budgetId;
            if (transaction.IncomeId) {
                const income = await Income.findOne({
                    where: {
                        id: transaction.IncomeId,
                    },
                });
                if (!income) {
                    throw new NotFoundError(
                        `${transaction.IncomeId}에 해당하는 수입이 존재하지 않습니다.`,
                    );
                }
                budgetId = income.BudgetId;
            } else if (transaction.ExpenseId) {
                const expense = await Expense.findOne({
                    where: {
                        id: transaction.ExpenseId,
                    },
                });
                if (!expense) {
                    throw new NotFoundError(
                        `${transaction.ExpenseId}에 해당하는 지출이 존재하지 않습니다.`,
                    );
                }
                budgetId = expense.BudgetId;
            }
            const budget = await Budget.findOne({
                where: {
                    id: budgetId,
                },
            });
            if (!budget) {
                throw new NotFoundError(
                    `${budgetId}에 해당하는 예산이 존재하지 않습니다.`,
                );
            }
            const year = budget.year;
            const half = budget.half;
            const organizationId = budget.OrganizationId;

            const organization = await Organization.findOne({
                where: {
                    id: organizationId,
                },
            });
            if (!organization) {
                throw new NotFoundError(
                    `${organizationId}에 해당하는 기구가 존재하지 않습니다.`,
                );
            }

            const key = `${
                organization.name
            }/${year}/${half}/transaction_records/${
                req.params.transaction_id
            }/${req.file!.originalname}`;

            const uploadResponse = await uploadFileToS3(req.file!, key);
            if (uploadResponse.statusCode !== 200) {
                throw new BadGatewayError(
                    'S3에 파일을 업로드하는데 실패했습니다.',
                );
            }

            const transactionRecord = await TransactionRecord.create({
                TransactionId: req.params.transaction_id,
                URI: key,
                note: req.body.note,
            });
            transactionRecord.URI = s3keyToUri(transactionRecord.URI);
            res.json(transactionRecord);
        }),
    );

    router.delete(
        '/:transaction_record_id',
        wrapAsync(validateOrganization),
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info(
                'TransactionRecordController: deleteTransactionRecord called',
            );
            await TransactionRecord.destroy({
                where: {
                    id: req.params.transaction_record_id,
                },
            });
            res.sendStatus(200);
        }),
    );
    return router;
}
