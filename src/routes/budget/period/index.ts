import express from 'express';
import { AuditPeriod } from '../../../model';

const router = express.Router();

router.post('/:year/:half', async (req, res, next) => {
    try {
        const auditPeriod = await AuditPeriod.create({
            year: req.params.year,
            half: req.params.half,
            start: req.body.start,
            end: req.body.end,
        });
        res.json(auditPeriod.toJSON());
    } catch (error) {
        next(error);
    }
});

router.put('/:year/:half', async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
});

export const periods = router;
