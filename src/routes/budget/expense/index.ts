import express from 'express';
import { wrapAsync } from '../../../middleware';
import { validateCode } from '../../../middleware/budget';
import errorHandler from '../../../middleware/error_handler';
import * as validate_audit_period from '../../../middleware/validate_audit_period';
import { Expense } from '../../../model';
import { validateOrganization } from '../../../middleware/auth';

const router = express.Router();

router.post(
    '/:budget_id',
    wrapAsync(validate_audit_period.validateAuditPeriodByBudgetId),
    wrapAsync(validateOrganization),
    validateCode,
    async (req, res, next) => {
        try {
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

router.put(
    '/:expense_id',
    wrapAsync(validate_audit_period.validateAuditPeriodByExpenseId),
    wrapAsync(validateOrganization),
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

router.delete(
    '/:expense_id',
    wrapAsync(validate_audit_period.validateAuditPeriodByExpenseId),
    wrapAsync(validateOrganization),
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

router.use(errorHandler);

export const expenses = router;
