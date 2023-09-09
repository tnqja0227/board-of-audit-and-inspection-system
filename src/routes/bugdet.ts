// 예산

import express from 'express';
import * as db from '../db';

const router = express.Router();

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
