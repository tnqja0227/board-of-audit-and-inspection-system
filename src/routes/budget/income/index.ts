import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { wrapAsync } from '../../../middleware';
import { validateCode } from '../../../middleware/budget';
import errorHandler from '../../../middleware/error_handler';
import { validateAuditPeriod } from '../../../middleware/validate_audit_period';
import { Income } from '../../../model';
import { validateOrganization } from '../../../middleware/auth';

const router = express.Router();

router.post(
    '/:budget_id',
    wrapAsync(validateAuditPeriod),
    wrapAsync(validateOrganization),
    validateCode,
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
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
    }),
);

router.put(
    '/:income_id',
    wrapAsync(validateAuditPeriod),
    wrapAsync(validateOrganization),
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

router.delete(
    '/:income_id',
    wrapAsync(validateAuditPeriod),
    wrapAsync(validateOrganization),
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

router.use(errorHandler);

export const incomes = router;
