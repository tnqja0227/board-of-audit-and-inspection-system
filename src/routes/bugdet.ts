// 예산
// semester: 'spring', 'fall'
// status: 'in progress', 'approved', 'rejected'
// source: '학생회비'

import express from 'express';
import { Budget, Expense, Income } from '../model';
import { sequelize } from '../db';
import { QueryTypes } from 'sequelize';

const router = express.Router();

router.get('/income/:budget_id', async (req, res, next) => {
    try {
        const incomes = await Income.findAll({
            where: {
                BudgetId: req.params.budget_id,
            },
        });
        res.json(incomes.map((income) => income.toJSON()));
    } catch (error) {
        next(error);
    }
});

router.post('/income/:budget_id', async (req, res, next) => {
    try {
        const income = await Income.create({
            BudgetId: req.params.budget_id,
            source: req.body.source, // '학생회비', '본회계', '자치'
            category: req.body.category,
            content: req.body.content,
            amount: req.body.amount,
            note: req.body.note,
        });
        res.json(income.toJSON());
    } catch (error) {
        next(error);
    }
});

router.delete('/income/:income_id', async (req, res, next) => {
    try {
        await Income.destroy({
            where: {
                id: req.params.income_id,
            },
        });
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/income/:income_id', async (req, res, next) => {
    try {
        await Income.update(
            {
                source: req.body.source, // '학생회비', '본회계', '자치'
                category: req.body.category,
                content: req.body.content,
                amount: req.body.amount,
                note: req.body.note,
            },
            {
                where: {
                    id: req.params.income_id,
                },
            },
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.get('/expense/:budget_id', async (req, res, next) => {
    try {
        const expenses = await Expense.findAll({
            where: {
                BudgetId: req.params.budget_id,
            },
        });
        res.json(expenses.map((expense) => expense.toJSON()));
    } catch (error) {
        next(error);
    }
});

router.post('/expense/:budget_id', async (req, res, next) => {
    try {
        const expense = await Expense.create({
            BudgetId: req.params.budget_id,
            source: req.body.source, // '학생회비', '본회계', '자치'
            category: req.body.category,
            project: req.body.project,
            content: req.body.content,
            amount: req.body.amount,
            note: req.body.note,
        });
        res.json(expense.toJSON());
    } catch (error) {
        next(error);
    }
});

router.delete('/expense/:expense_id', async (req, res, next) => {
    try {
        await Expense.destroy({
            where: {
                id: req.params.expense_id,
            },
        });
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/expense/:expense_id', async (req, res, next) => {
    try {
        await Expense.update(
            {
                source: req.body.source, // '학생회비', '본회계', '자치'
                category: req.body.category,
                project: req.body.project,
                content: req.body.content,
                amount: req.body.amount,
                note: req.body.note,
            },
            {
                where: {
                    id: req.params.expense_id,
                },
            },
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

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
            const schema_name = process.env.NODE_ENV === 'development' ? '"development"' : '"production"';
            const income_table = schema_name + '."incomes"';
            const budget_table = schema_name + '."budgets"';
            const result = await sequelize.query(
                `WITH row_numbered AS (
                    SELECT SOURCE, category, CONTENT, amount, note, "BudgetId", ROW_NUMBER() OVER (PARTITION BY SOURCE
                    ORDER BY
                        I.id) AS rn
                    FROM(
                        ${income_table} AS I
                        JOIN (
                            SELECT id, YEAR, half, "OrganizationId"
                        FROM ${budget_table}
                        WHERE "OrganizationId" = ${req.params.organization_id} AND
                            YEAR = ${req.params.year} AND half = '${req.params.half}'
                        ) AS B
                        ON I."BudgetId" = B.id
                    )
                )
                
                SELECT SOURCE, json_agg(jsonb_build_object('category', category, 'content', CONTENT,
                    'amount', amount, 'note', note, 'code', code))
                FROM(
                    SELECT SOURCE, category, CONTENT, amount, note, CASE
                            WHEN SOURCE = '학생회비' THEN 100 + rn
                            WHEN SOURCE = '본회계' THEN 200 + rn
                            WHEN SOURCE = '자치' THEN 300 + rn
                                    END AS code
                    FROM row_numbered
                ) Subquery
                GROUP BY 
                    SOURCE
                ORDER BY
                    SOURCE;
                `,
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
            const schema_name = process.env.NODE_ENV === 'development' ? '"development"' : '"production"';
            const expense_table = schema_name + '."expenses"';
            const budget_table = schema_name + '."budgets"';
            const result = await sequelize.query(
                `WITH row_numbered AS (
                    SELECT SOURCE, category, CONTENT, project, amount, note, "BudgetId", ROW_NUMBER() OVER (PARTITION BY SOURCE
                    ORDER BY
                        E.id) AS rn
                    FROM(
                        ${expense_table} AS E
                        JOIN (
                            SELECT id, YEAR, half, "OrganizationId"
                        FROM ${budget_table}
                        WHERE "OrganizationId" = ${req.params.organization_id} AND
                            YEAR = ${req.params.year} AND half = '${req.params.half}'
                        ) AS B
                        ON E."BudgetId" = B.id
                    )
                )
                
                SELECT SOURCE, json_agg(jsonb_build_object('category', category, 'content', CONTENT,
                    'project', project, 'amount', amount, 'note', note, 'code', code))
                FROM(
                    SELECT SOURCE, category, CONTENT, project, amount, note, CASE
                            WHEN SOURCE = '학생회비' THEN 400 + rn
                            WHEN SOURCE = '본회계' THEN 500 + rn
                            WHEN SOURCE = '자치' THEN 600 + rn
                                    END AS code
                    FROM row_numbered
                ) Subquery
                GROUP BY 
                    SOURCE
                ORDER BY
                    SOURCE;
                `,
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
