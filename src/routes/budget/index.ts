import express from 'express';
import { incomes } from './income';
import { expenses } from './expense';
import { Budget } from '../../model';
import { periods } from './period';
import { sequelize } from '../../db';
import { QueryTypes } from 'sequelize';

const router = express.Router();
router.use('/income', incomes);
router.use('/expense', expenses);
router.use('/period', periods);

// TODO: query options
router.get('/', async (req, res, next) => {
    try {
        const budgets = await Budget.findAll();
        res.json(budgets.map((budget) => budget.toJSON()));
    } catch (error) {
        next(error);
    }
});

// prettier-ignore
router.get(
    '/report/income/:organization_id/:year/:half',
    async (req, res, next) => {
        try {
            const schema_name = process.env.NODE_ENV || 'development';
            const income_table = schema_name + '."incomes"';
            const budget_table = schema_name + '."budgets"';
            const transaction_table = schema_name + '."transactions"';
            const result = await sequelize.query(
                `WITH target_income AS (
                    SELECT "id", "source", "category", "content", "amount" budget, COALESCE("income", 0) income, COALESCE("income", 0)::float / "amount"::float ratio, "note", "code"
                    FROM ${income_table} AS I 
                        LEFT JOIN (
                            SELECT sum(amount) AS income, "IncomeId"
                            FROM ${transaction_table}
                            WHERE "IncomeId" IS not NULL
                            GROUP BY "IncomeId") AS T
                        ON I.id = T."IncomeId"
                    WHERE I."BudgetId" IN (
                        SELECT id
                        FROM ${budget_table}
                        WHERE "OrganizationId" = ${req.params.organization_id}
                            AND "year" = '${req.params.year}' AND "half" = '${req.params.half}'
                    )
                )
                
                SELECT "source", sum("budget") "예산 소계", sum("income") "결산 소계", sum("income")::float / sum("budget")::float "비율", 
                    json_agg(jsonb_build_object('예산 분류', category, '항목', CONTENT, '예산', budget, 
                    '결산', income, '비율', ratio, '비고', note, '코드', code))
                FROM target_income
                GROUP BY "source"
                ORDER BY "source";`
                ,
                {
                    type: QueryTypes.SELECT,
                },
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
);

// prettier-ignore
router.get(
    '/report/expense/:organization_id/:year/:half',
    async (req, res, next) => {
        try {
            const schema_name = process.env.NODE_ENV || 'development';
            const expense_table = schema_name + '."expenses"';
            const budget_table = schema_name + '."budgets"';
            const transaction_table = schema_name + '."transactions"';
            const result = await sequelize.query(
                `WITH target_expenses AS (
                    SELECT "id", "source", "category", "content", "project", "amount" budget, COALESCE("expense", 0) expense, COALESCE("expense", 0)::float / "amount"::float ratio, "note", "code"
                    FROM ${expense_table} AS E
                        LEFT JOIN (
                            SELECT sum(amount) AS expense, "ExpenseId"
                            FROM ${transaction_table}
                            WHERE "ExpenseId" IS not NULL
                            GROUP BY "ExpenseId") AS T
                        ON E.id = T."ExpenseId"
                    WHERE "BudgetId" IN (
                        SELECT id
                        FROM ${budget_table}
                        WHERE "OrganizationId" = ${req.params.organization_id}
                            AND "year" = '${req.params.year}' AND "half" = '${req.params.half}'
                    )
                )
                
                SELECT "source", sum("budget") "예산 소계", sum("expense") "결산 소계", sum("expense")::float / sum("budget")::float "비율", 
                    json_agg(jsonb_build_object('예산 분류', category, '항목', CONTENT, '사업', project, 
                    '예산', budget, '결산', expense, '비율', ratio, '비고', note, '코드', code))
                FROM target_expenses
                GROUP BY "source"
                ORDER BY "source";`
                ,
                {
                    type: QueryTypes.SELECT,
                },
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
);

router.post('/:organization_id/:year/:half', async (req, res, next) => {
    try {
        const budget = await Budget.create({
            OrganizationId: req.params.organization_id,
            year: req.params.year,
            half: req.params.half,
            manager: req.body.manager,
        });
        res.json(budget.toJSON());
    } catch (error) {
        next(error);
    }
});

router.delete('/:organization_id/:year/:half', async (req, res, next) => {
    try {
        await Budget.destroy({
            where: {
                OrganizationId: req.params.organization_id,
                year: req.params.year,
                half: req.params.half,
            },
        });
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const budgets = router;
