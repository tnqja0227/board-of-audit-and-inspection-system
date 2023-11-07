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
            if (req.body.code.length !== 3) {
                return res.status(400).send('예산 코드는 3자리여야 합니다.');
            }
            if (req.body.source === '학생회비' && req.body.code[0] !== '1') {
                return res
                    .status(400)
                    .send('학생회비는 1로 시작하는 예산 코드여야 합니다.');
            } else if (
                req.body.source === '본회계' &&
                req.body.code[0] !== '2'
            ) {
                return res
                    .status(400)
                    .send('본회계는 2로 시작하는 예산 코드여야 합니다.');
            } else if (req.body.source === '자치' && req.body.code[0] !== '3') {
                return res
                    .status(400)
                    .send('자치는 3으로 시작하는 예산 코드여야 합니다.');
            }

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
