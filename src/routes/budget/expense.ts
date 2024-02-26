import express from 'express';
import { validateAuditPeriod, wrapAsync } from '../../middleware';
import { validateOrganization } from '../../middleware/auth';
import { validateCode } from '../../middleware/budget';
import { BudgetController, ExpenseController } from '../../controller';

export function createExpenseRouter() {
    const router = express.Router();
    const budgetController = new BudgetController();
    const expenseController = new ExpenseController();

    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(budgetController.getExpenseBudget),
    );

    router.get(
        '/list/:organization_id/:year/:half',
        wrapAsync(expenseController.listExpenses),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post(
        '/:budget_id',
        validateCode,
        wrapAsync(expenseController.createExpense),
    );

    router.put('/:expense_id', wrapAsync(expenseController.updateExpense));

    router.delete('/:expense_id', wrapAsync(expenseController.deleteExpense));

    return router;
}
