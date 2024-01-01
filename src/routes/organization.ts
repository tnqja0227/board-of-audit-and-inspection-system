import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Organization } from '../model';
import { validateIsAdmin } from '../middleware/auth';
import { wrapAsync } from '../middleware';
import { OrganizationController } from '../controller';

export function createOrganizationsRouter() {
    const router = express.Router();
    const organizationController = new OrganizationController();

    router.use(wrapAsync(validateIsAdmin));

    router.get('/', wrapAsync(organizationController.findAll));

    router.post('/', wrapAsync(organizationController.createOrganization));

    return router;
}
