import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { validateAuditPeriod, wrapAsync } from '../../middleware';
import { validateOrganization } from '../../middleware/auth';
import { Income } from '../../model';
import { validateCode } from '../../middleware/budget';
import * as BudgetService from '../../service/budget';

export function createIncomeRouter() {
    const router = express.Router();
    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const organization_id = req.params.organization_id;
            const year = req.params.year;
            const half = req.params.half;
            const budget = await BudgetService.getIncomeBudget(
                organization_id,
                year,
                half,
            );
            res.json(budget);
        }),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post(
        '/:budget_id',
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
            });
            res.json(income.toJSON());
        }),
    );

    router.put('/:income_id', async (req, res, next) => {
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
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
        });
    });

    router.delete('/:income_id', async (req, res, next) => {
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Income.destroy({
                where: {
                    id: req.params.income_id,
                },
            });
            res.sendStatus(200);
        });
    });

    return router;
}
