import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { validateOrganization } from '../middleware/auth';
import { wrapAsync } from '../middleware';
import { Account } from '../model';

export function createAccountsRouter() {
    const router = express.Router();
    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            const accounts = await Account.findAll({
                where: {
                    OrganizationId: req.params.organization_id,
                    year: req.params.year,
                    half: req.params.half,
                },
                order: [['accountNumber', 'ASC']],
            });
            res.json(accounts.map((account) => account.toJSON()));
        }),
    );

    router.post(
        '/:organization_id/:year/:half',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Account.create({
                year: req.params.year,
                half: req.params.half,
                name: req.body.name,
                accountNumber: req.body.accountNumber,
                accountBank: req.body.accountBank,
                accountOwner: req.body.accountOwner,
                cardNumber: req.body.cardNumber,
                OrganizationId: req.params.organization_id,
            });
            res.sendStatus(200);
        }),
    );

    router.put(
        '/:id',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Account.update(
                {
                    name: req.body.name,
                    accountNumber: req.body.accountNumber,
                    accountBank: req.body.accountBank,
                    accountOwner: req.body.accountOwner,
                    cardNumber: req.body.cardNumber,
                },
                {
                    where: {
                        id: req.params.id,
                    },
                },
            );
            res.sendStatus(200);
        }),
    );

    router.delete(
        '/:id',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            await Account.destroy({
                where: {
                    id: req.params.id,
                },
            });
            res.sendStatus(200);
        }),
    );

    return router;
}
