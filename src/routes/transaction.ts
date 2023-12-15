import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../model';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import * as TransactionService from '../service/transaction';
import { BadRequestError } from '../utils/errors';

export function createTransactionsRouter() {
    const router = express.Router();
    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const transactions = await TransactionService.getTransactions(
                req.params.organization_id,
                req.params.year,
                req.params.half,
            );
            res.json(transactions);

            // TODO: pagination
            // if (req.query.page === undefined) {
            //     res.json(transactions);
            // } else {
            //     const page = parseInt(req.query.page as string);
            //     const limit = 20;
            //     const startIndex = (page - 1) * limit;
            //     const endIndex = page * limit;
            //     const transaction1page = transactions.slice(startIndex, endIndex);
            //     res.json(transaction1page);
            // }
        }),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post(
        '/',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const { organizationId, year, half } =
                await TransactionService.getBudgetPrimaryKey(req);
            const transactionAt = req.body.transaction_at;
            const signedAmount = req.body.income_id
                ? req.body.amount
                : -req.body.amount;

            const integratedTransaction =
                await TransactionService.getIntegratedTransactions(
                    organizationId,
                    year,
                    half,
                );
            const beforeTransactions: any[] = integratedTransaction.filter(
                (transaction: any) => {
                    return (
                        new Date(transaction.transactionAt) <=
                        new Date(transactionAt)
                    );
                },
            );
            const afterTransactions: any[] = integratedTransaction.filter(
                (transaction: any) => {
                    return (
                        new Date(transaction.transactionAt) >
                        new Date(transactionAt)
                    );
                },
            );
            const latestTransaction =
                beforeTransactions.length === 0
                    ? null
                    : beforeTransactions[beforeTransactions.length - 1];
            const latestBalanceBeforeTransaction = latestTransaction
                ? latestTransaction.balance
                : 0;
            const currentBalance =
                latestBalanceBeforeTransaction + signedAmount;

            const transaction = await Transaction.create({
                projectAt: req.body.project_at,
                manager: req.body.manager,
                content: req.body.content,
                type: req.body.type,
                amount: req.body.amount,
                balance: currentBalance,
                transactionAt: req.body.transaction_at,
                accountNumber: req.body.account_number,
                accountBank: req.body.account_bank,
                accountOwner: req.body.account_owner,
                receivingAccountNumber: req.body.receiving_account_number,
                receivingAccountBank: req.body.receiving_account_bank,
                receivingAccountOwner: req.body.receiving_account_owner,
                hasBill: req.body.has_bill,
                note: req.body.note,
                IncomeId: req.body.income_id,
                ExpenseId: req.body.expense_id,
            });

            for (const transaction of afterTransactions) {
                await Transaction.update(
                    {
                        balance: transaction.balance + signedAmount,
                    },
                    {
                        where: {
                            id: transaction.id,
                        },
                    },
                );
            }
            res.json(transaction.toJSON());
        }),
    );

    router.delete(
        '/:transaction_id',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Transaction.destroy({
                where: {
                    id: req.params.transaction_id,
                },
            });
            res.sendStatus(200);
        }),
    );

    router.put(
        '/:transaction_id',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            if (req.body.income_id && req.body.expense_id) {
                throw new BadRequestError(
                    'income_id와 expense_id 중 하나만 존재해야 합니다.',
                );
            }

            await Transaction.update(
                {
                    projectAt: req.body.project_at,
                    manager: req.body.manager,
                    content: req.body.content,
                    type: req.body.type, // '공금카드', '개인카드', '계좌이체', '현금거래', '사비집행'
                    amount: req.body.amount,
                    transactionAt: req.body.transaction_at,
                    accountNumber: req.body.account_number,
                    accountBank: req.body.account_bank,
                    accountOwner: req.body.account_owner,
                    hasBill: req.body.has_bill,
                    note: req.body.note,
                    IncomeId: req.body.income_id,
                    ExpenseId: req.body.expense_id,
                },
                {
                    where: {
                        id: req.params.transaction_id,
                    },
                },
            );

            res.sendStatus(200);
        }),
    );

    return router;
}
