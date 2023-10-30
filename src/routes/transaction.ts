// 통장 거래 내역

import express from 'express';
import { Transaction } from '../model';
import { validateIsAdmin } from '../middleware';

const router = express.Router();

router.get('/', validateIsAdmin, async (req, res, next) => {
    try {
        const transactions = await Transaction.findAll();
        res.json(transactions.map((transaction) => transaction.toJSON()));
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        // income id와 expense id 중 하나만 존재해야 함
        if (req.body.income_id && req.body.expense_id) {
            return res.sendStatus(400);
        }

        const transaction = await Transaction.create({
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
        });
        res.json(transaction.toJSON());
    } catch (error) {
        next(error);
    }
});

router.delete('/:transaction_id', async (req, res, next) => {
    try {
        await Transaction.destroy({
            where: {
                id: req.params.transaction_id,
            },
        });
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/:transaction_id', async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
});

export const transactions = router;
