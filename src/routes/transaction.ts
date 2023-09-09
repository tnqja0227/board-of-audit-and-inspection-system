// 통장 거래 내역

import express from 'express';
import * as db from '../db';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const transactions = await db.query('SELECT * FROM transaction', []);
        res.json(transactions.rows);
    } catch (error) {
        next(error);
    }
});

router.post('/:budget_id', async (req, res, next) => {
    try {
        await db.query(
            'INSERT INTO "transaction" (budget_id, project_date, manager_name, description, transaction_type, "type", amount, transaction_date, account_number, account_bank, account_owner, remarks) \
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [
                req.params.budget_id,
                req.body.project_date,
                req.body.manager_name,
                req.body.description,
                req.body.transaction_type,
                req.body.type,
                req.body.amount,
                req.body.transaction_date,
                req.body.account_number,
                req.body.account_bank,
                req.body.account_owner,
                req.body.remarks,
            ],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.delete('/:transaction_id', async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM "transaction" WHERE transaction_id = ($1)',
            [req.params.transaction_id],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/:transaction_id', async (req, res, next) => {
    try {
        await db.query(
            'UPDATE "transaction" SET budget_id = ($1), project_date = ($2), manager_name = ($3), description = ($4), transaction_type = ($5), "type" = ($6), amount = ($7), transaction_date = ($8), account_number = ($9), account_bank = ($10), account_owner = ($11), remarks = ($12) WHERE transaction_id = ($13)',
            [
                req.body.budget_id,
                req.body.project_date,
                req.body.manager_name,
                req.body.description,
                req.body.transaction_type,
                req.body.type,
                req.body.amount,
                req.body.transaction_date,
                req.body.account_number,
                req.body.account_bank,
                req.body.account_owner,
                req.body.remarks,
                req.params.transaction_id,
            ],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const transactions = router;
