import express from 'express';
import { validateAuditPeriod, wrapAsync } from '../../middleware';
import { validateOrganization } from '../../middleware/auth';
import { validateCode } from '../../middleware/budget';
import { BudgetController, IncomeController } from '../../controller';

export function createIncomeRouter() {
    const router = express.Router();
    const budgetController = new BudgetController();
    const incomeController = new IncomeController();

    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(budgetController.getIncomeBudget),
    );

    router.get(
        '/list/:organization_id/:year/:half',
        wrapAsync(incomeController.listIncomes),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post(
        '/:budget_id',
        validateCode,
        wrapAsync(incomeController.createIncome),
    );

    router.put('/:income_id', wrapAsync(incomeController.updateIncome));

    router.delete('/:income_id', wrapAsync(incomeController.deleteIncome));

    return router;
}
