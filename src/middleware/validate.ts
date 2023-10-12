import { Request, Response, NextFunction } from 'express';
import { AuditPeriod, Budget } from '../model';

export async function validateAuditPeriod(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const budgetId = req.params.budget_id;
        const budget = await Budget.findByPk(budgetId);
        if (!budget) {
            return res.sendStatus(404);
        }

        const year = budget.year;
        const half = budget.half;
        const auditPeriod = await AuditPeriod.findOne({
            where: {
                year: year,
                half: half,
            },
        });
        if (!auditPeriod) {
            return res.sendStatus(404);
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.sendStatus(403);
        }
        next();
    } catch (error) {
        next(error);
    }
}
