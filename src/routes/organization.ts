import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Organization } from '../model';
import { validateIsAdmin } from '../middleware/auth';
import { wrapAsync } from '../middleware';
const router = express.Router();

router.get(
    '/',
    wrapAsync(validateIsAdmin),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const organizations = await Organization.findAll();
        res.json(organizations.map((organization) => organization.toJSON()));
    }),
);

router.post(
    '/',
    wrapAsync(validateIsAdmin),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const organization = await Organization.create({
            name: req.body.name,
        });
        res.json(organization.toJSON());
    }),
);

export const organizations = router;
