import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../model';
import { sequelize } from '../db';
import { QueryTypes } from 'sequelize';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';

const router = express.Router();

// TODO: convert to js code
router.get(
    '/:organization_id/:year/:half',
    wrapAsync(validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const schema_name = process.env.NODE_ENV || 'development';
        const transaction_table = schema_name + '."transactions"';
        const income_table = schema_name + '."incomes"';
        const expense_table = schema_name + '."expenses"';
        const budget_table = schema_name + '."budgets"';
        const transactions = await sequelize.query(
            `SELECT *
            FROM
                (
                    SELECT T."id", T."projectAt", T."manager", T."content", T."type", T."amount", T."transactionAt", T."accountNumber", T."accountBank", T."accountOwner", T."hasBill", T."note", T."IncomeId", T."ExpenseId", I."code"
                    FROM ${income_table} AS I 
                        INNER JOIN ${transaction_table} AS T
                        ON I.id = T."IncomeId"
                    WHERE I."BudgetId" IN (
                        SELECT id
                        FROM ${budget_table}
                        WHERE "OrganizationId" = ${req.params.organization_id}
                            AND "year" = '${req.params.year}' AND "half" = '${req.params.half}'
                    )
                ) as TIE
                UNION ALL
                (
                    SELECT T."id", T."projectAt", T."manager", T."content", T."type", T."amount", T."transactionAt", T."accountNumber", T."accountBank", T."accountOwner", T."hasBill", T."note", T."IncomeId", T."ExpenseId", E."code"
                    FROM ${expense_table} AS E
                        INNER JOIN ${transaction_table} AS T
                        ON E.id = T."ExpenseId"
                    WHERE "BudgetId" IN (
                        SELECT id
                        FROM ${budget_table}
                        WHERE "OrganizationId" = ${req.params.organization_id}
                            AND "year" = '${req.params.year}' AND "half" = '${req.params.half}'
                    )
                )
            ORDER BY "transactionAt" DESC`,
            {
                type: QueryTypes.SELECT,
            },
        );

        if (req.query.page === undefined) {
            res.json(transactions);
        } else {
            const page = parseInt(req.query.page as string);
            const limit = 20;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const transaction1page = transactions.slice(startIndex, endIndex);
            res.json(transaction1page);
        }
    }),
);

// TODO: check organization
router.post(
    '/',
    wrapAsync(validateAuditPeriod),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        if (!req.body.income_id && !req.body.expense_id) {
            return res
                .status(400)
                .send('income_id와 expense_id 중 하나는 존재해야 합니다.');
        }

        if (req.body.income_id && req.body.expense_id) {
            return res
                .status(400)
                .send('income_id와 expense_id 중 하나만 존재해야 합니다.');
        }

        const transaction = await Transaction.create({
            projectAt: req.body.project_at,
            manager: req.body.manager,
            content: req.body.content,
            type: req.body.type,
            amount: req.body.amount,
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
        res.json(transaction.toJSON());
    }),
);

router.delete(
    '/:transaction_id',
    wrapAsync(validateAuditPeriod),
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
    wrapAsync(validateAuditPeriod),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        if (req.body.income_id && req.body.expense_id) {
            return res
                .status(400)
                .send('income_id와 expense_id 중 하나만 존재해야 합니다.');
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

export const transactions = router;
