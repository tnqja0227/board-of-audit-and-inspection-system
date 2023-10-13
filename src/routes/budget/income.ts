import express from 'express';
import { Income } from '../../model';
import {
    validateAuditPeriodByBudgetId,
    validateAuditPeriodByIncomeId,
} from '../../middleware';

const router = express.Router();

router.get('/:budget_id', async (req, res, next) => {
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

router.post(
    '/:budget_id',
    validateAuditPeriodByBudgetId,
    async (req, res, next) => {
        try {
            const income = await Income.create({
                BudgetId: req.params.budget_id,
                code: req.body.code,
                source: req.body.source, // '학생회비', '본회계', '자치'
                category: req.body.category,
                content: req.body.content,
                amount: req.body.amount,
                note: req.body.note,
                isReadonly: req.body.is_readonly,
            });
            res.json(income.toJSON());
        } catch (error) {
            next(error);
        }
    },
);

router.delete(
    '/:income_id',
    validateAuditPeriodByIncomeId,
    async (req, res, next) => {
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
    },
);

router.put(
    '/:income_id',
    validateAuditPeriodByIncomeId,
    async (req, res, next) => {
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
    },
);

export const incomes = router;
