import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../service';
import logger from '../config/winston';

class OrganizationController {
    private organizationService: OrganizationService =
        new OrganizationService();

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('OrganizationController: findAll called');

        const organizations = await this.organizationService.findAll();
        res.json(organizations);
    };

    createOrganization = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('OrganizationController: createOrganization called');

        const organization_name = req.body.name;
        const organization =
            await this.organizationService.createOrganization(
                organization_name,
            );
        res.json(organization);
    };
}

export { OrganizationController };
