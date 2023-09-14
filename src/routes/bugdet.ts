// 예산
// semester: 'spring', 'fall'
// status: 'in progress', 'approved', 'rejected'
// source: '학생회비'

import express from 'express';
import { Budget, Expense, Income } from '../model';

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
