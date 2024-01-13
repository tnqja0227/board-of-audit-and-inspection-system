import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { wrapAsync } from '../../middleware';
import { validateIsAdmin } from '../../middleware/auth';
import { AuditPeriod } from '../../model';

export function createPeriodRouter() {
    const router = express.Router();
    router.use(wrapAsync(validateIsAdmin));

    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        const auditPeriods = await AuditPeriod.findAll({
            order: [
                ['year', 'ASC'],
                ['half', 'ASC'],
            ],
        });
        res.json(auditPeriods);
    });

    router.post(
        '/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const auditPeriod = await AuditPeriod.create({
                year: req.params.year,
                half: req.params.half,
                start: req.body.start,
                end: req.body.end,
            });
            res.json(auditPeriod.toJSON());
        }),
    );

    router.put(
        '/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await AuditPeriod.update(
                {
                    start: req.body.start,
                    end: req.body.end,
                },
                {
                    where: {
                        year: req.params.year,
                        half: req.params.half,
                    },
                },
            );
            res.sendStatus(200);
        }),
    );

    return router;
}
