// 예산
// semester: 'spring', 'fall'
// status: 'in progress', 'approved', 'rejected'
// source: '학생회비'

import express from 'express';
import * as db from '../db';

const router = express.Router();

router.get('/income/:budget_id', async (req, res, next) => {
    try {
        const incomes = await db.query(
            'SELECT * FROM income WHERE budget_id = ($1);',
            [req.params.budget_id],
        );
        res.json(incomes.rows);
    } catch (error) {
        next(error);
    }
});

router.post('/income/:budget_id/:code', async (req, res, next) => {
    try {
        await db.query(
            // amount: 예산액, status: 상태, opinion: 감사 의견, remark: 비고
            'INSERT INTO income (budget_id, code, amount, remarks) values ($1, $2, $3, $4);',
            [
                req.params.budget_id,
                req.params.code,
                req.body.amount,
                req.body.remarks,
            ],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.delete('/income/:budget_id/:code', async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM income WHERE budget_id = ($1) AND code = ($2);',
            [req.params.budget_id, req.params.code],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/income/:budget_id/:code', async (req, res, next) => {
    try {
        await db.query(
            'UPDATE income SET amount = ($1), remarks = ($2) WHERE budget_id = ($3) AND code = ($4);',
            [
                req.body.amount,
                req.body.remarks,
                req.params.budget_id,
                req.params.code,
            ],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.get('/expense/:budget_id', async (req, res, next) => {
    try {
        const expenses = await db.query(
            'SELECT * FROM expense WHERE budget_id = ($1);',
            [req.params.budget_id],
        );
        res.json(expenses.rows);
    } catch (error) {
        next(error);
    }
});

router.post('/expense/:budget_id/:code', async (req, res, next) => {
    try {
        await db.query(
            // amount: 예산액, source: 자금 출처, status: 상태, opinion: 감사 의견, remark: 비고
            'INSERT INTO expense (budget_id, code, amount, source, project_name, department_name, manager_name, remarks) \
                values ($1, $2, $3, $4, $5, $6, $7, $8);',
            [
                req.params.budget_id,
                req.params.code,
                req.body.amount,
                req.body.source,
                req.body.project_name,
                req.body.department_name,
                req.body.manager_name,
                req.body.remarks,
            ],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.delete('/expense/:budget_id/:code', async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM expense WHERE budget_id = ($1) AND code = ($2);',
            [req.params.budget_id, req.params.code],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/expense/:budget_id/:code', async (req, res, next) => {
    try {
        await db.query(
            'UPDATE expense SET amount = ($1), source = ($2), project_name = ($3), department_name = ($4), manager_name = ($5), remarks = ($6) \
                WHERE budget_id = ($7) AND code = ($8);',
            [
                req.body.amount,
                req.body.source,
                req.body.project_name,
                req.body.department_name,
                req.body.manager_name,
                req.body.remarks,
                req.params.budget_id,
                req.params.code,
            ],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const budgets = await db.query('SELECT * FROM budget', []);
        res.json(budgets.rows);
    } catch (error) {
        next(error);
    }
});

router.post('/:organization_id/:year/:semester', async (req, res, next) => {
    try {
        await db.query(
            'INSERT INTO budget (organization_id, year, semester) values ($1, $2, $3);',
            [req.params.organization_id, req.params.year, req.params.semester],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.delete('/:organization_id/:year/:semester', async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM budget WHERE organization_id = ($1) AND year = ($2) AND semester = ($3);',
            [req.params.organization_id, req.params.year, req.params.semester],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const budgets = router;
