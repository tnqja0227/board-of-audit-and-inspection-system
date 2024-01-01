import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { validateAuditPeriod, wrapAsync } from '../../middleware';
import { validateOrganization } from '../../middleware/auth';
import { Expense } from '../../model';
import { validateCode } from '../../middleware/budget';
import { BudgetController } from '../../controller';

export function createExpenseRouter() {
    const router = express.Router();
    const budgetController = new BudgetController();
    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(budgetController.getExpenseBudget),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post('/:budget_id', validateCode, async (req, res, next) => {
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
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
        });
    });

    router.put('/:expense_id', async (req, res, next) => {
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
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
        });
    });

    router.delete('/:expense_id', async (req, res, next) => {
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Expense.destroy({
                where: {
                    id: req.params.expense_id,
                },
            });
            res.sendStatus(200);
        });
    });

    return router;
}
