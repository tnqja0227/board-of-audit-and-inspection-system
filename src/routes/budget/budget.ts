import express from 'express';
import { validateAuditPeriod } from '../../middleware/validate_audit_period';
import { wrapAsync } from '../../middleware';
import { validateOrganization } from '../../middleware/auth';
import { createIncomeRouter } from './income';
import { createExpenseRouter } from './expense';
import { createPeriodRouter } from './audit_period';
import { BudgetController } from '../../controller';

export function createBudgetsRouter() {
    const router = express.Router();
    const budgetController = new BudgetController();

    router.use('/income', createIncomeRouter());
    router.use('/expense', createExpenseRouter());
    router.use('/period', createPeriodRouter());

    router.use(wrapAsync(validateOrganization));

    router.get(
        '/total/:organization_id/:year/:half',
        wrapAsync(budgetController.getTotal),
    );

    router.use(wrapAsync(validateAuditPeriod));

    // 예산안 생성
    router.post(
        '/:organization_id/:year/:half',
        wrapAsync(budgetController.createBudget),
    );

    // 예산안 삭제
    router.delete(
        '/:organization_id/:year/:half',
        wrapAsync(budgetController.deleteBudget),
    );

    return router;
}
