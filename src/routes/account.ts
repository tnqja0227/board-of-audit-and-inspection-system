import express from 'express';
import { validateOrganization } from '../middleware/auth';
import { wrapAsync } from '../middleware';
import { AccountController } from '../controller';

export function createAccountsRouter() {
    const router = express.Router();
    const accountController = new AccountController();

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(validateOrganization),
        wrapAsync(accountController.findAll),
    );

    router.post(
        '/:organization_id/:year/:half',
        wrapAsync(validateOrganization),
        wrapAsync(accountController.create),
    );

    router.put(
        '/:account_id',
        wrapAsync(validateOrganization),
        wrapAsync(accountController.update),
    );

    router.delete(
        '/:account_id',
        wrapAsync(validateOrganization),
        wrapAsync(accountController.delete),
    );

    return router;
}
