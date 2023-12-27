import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Budget } from '../../model';
import { validateAuditPeriod } from '../../middleware/validate_audit_period';
import { wrapAsync } from '../../middleware';
import * as BudgetService from '../../service/budget';
import { validateOrganization } from '../../middleware/auth';
import { createIncomeRouter } from './income';
import { createExpenseRouter } from './expense';
import { createPeriodRouter } from './period';

export function createBudgetsRouter() {
    const router = express.Router();

    router.use('/income', createIncomeRouter());
    router.use('/expense', createExpenseRouter());
    router.use('/period', createPeriodRouter());

    router.use(wrapAsync(validateOrganization));

    router.get(
        '/total/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const organization_id = req.params.organization_id;
            const year = req.params.year;
            const half = req.params.half;
            const result = await BudgetService.getTotalResult(
                organization_id,
                year,
                half,
            );
            res.json(result);
        }),
    );

    router.use(wrapAsync(validateAuditPeriod));

    // 예산안 생성
    router.post(
        '/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const budget = await Budget.create({
                OrganizationId: req.params.organization_id,
                year: req.params.year,
                half: req.params.half,
                manager: req.body.manager, // TODO: get manager from session
            });
            res.json(budget.toJSON());
        }),
    );

    // 예산안 삭제
    router.delete(
        '/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Budget.destroy({
                where: {
                    OrganizationId: req.params.organization_id,
                    year: req.params.year,
                    half: req.params.half,
                },
            });
            res.sendStatus(200);
        }),
    );

    return router;
}
