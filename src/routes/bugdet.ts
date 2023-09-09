// 예산
// semester: 'spring', 'fall'
// status: 'in progress', 'approved', 'rejected'

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

router.post('/income/:budget_id', async (req, res, next) => {
    try {
        await db.query(
            // amount: 예산액, status: 상태, opinion: 감사 의견, remark: 비고
            'INSERT INTO income (budget_id, code, amount, remarks) values ($1, $2, $3, $4);',
            [
                req.params.budget_id,
                req.body.code,
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
