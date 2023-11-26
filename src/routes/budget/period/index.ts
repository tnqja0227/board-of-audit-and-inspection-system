import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { AuditPeriod } from '../../../model';
import { validateIsAdmin } from '../../../middleware/auth';
import { wrapAsync } from '../../../middleware';

const router = express.Router();

router.post(
    '/:year/:half',
    wrapAsync(validateIsAdmin),
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
    wrapAsync(validateIsAdmin),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        // TODO: validate existence of audit period
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

export const periods = router;
