import express from 'express';
import { Expense } from '../../model';
import {
    validateAuditPeriodByBudgetId,
    validateAuditPeriodByExpenseId,
} from '../../middleware';

const router = express.Router();

router.get('/:budget_id', async (req, res, next) => {
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

router.post(
    '/:budget_id',
    validateAuditPeriodByBudgetId,
    async (req, res, next) => {
        try {
            if (req.body.code.length !== 3) {
                return res.status(400).send('예산 코드는 3자리여야 합니다.');
            }
            if (req.body.source === '학생회비' && req.body.code[0] !== '4') {
                return res
                    .status(400)
                    .send('학생회비는 4로 시작하는 예산 코드여야 합니다.');
            } else if (
                req.body.source === '본회계' &&
                req.body.code[0] !== '5'
            ) {
                return res
                    .status(400)
                    .send('본회계는 5로 시작하는 예산 코드여야 합니다.');
            } else if (req.body.source === '자치' && req.body.code[0] !== '6') {
                return res
                    .status(400)
                    .send('자치는 6으로 시작하는 예산 코드여야 합니다.');
            }

            const expense = await Expense.create({
                BudgetId: req.params.budget_id,
                code: req.body.code,
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
    },
);

router.delete(
    '/:expense_id',
    validateAuditPeriodByExpenseId,
    async (req, res, next) => {
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
    },
);

router.put(
    '/:expense_id',
    validateAuditPeriodByExpenseId,
    async (req, res, next) => {
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
    },
);

export const expenses = router;
