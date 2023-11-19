import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import logger from '../config/winston';

export async function validateIsAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!req.session.user) {
        logger.debug('Request does not have a session');
        throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const role = req.session.user.role;
    if (!isAdmin(role)) {
        logger.debug('Request does not have admin role');
        throw new UnauthorizedError('권한이 없습니다.');
    }
    logger.debug('Admin user is validated');
    next();
}

export async function validateOrganization(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!req.session.user) {
        logger.debug('Request does not have a session');
        throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const role = req.session.user.role;
    if (isAdmin(role)) {
        logger.debug('Authorization is passed because the user is admin');
        return next();
    }

    const organization = req.session.user!.OrganizationId;
    if (organization !== req.params.organization_id) {
        logger.debug('Request does not have a valid organization');
        throw new UnauthorizedError('권한이 없습니다.');
    }
    logger.debug('Organization is validated');
    next();
}

function isAdmin(role: string) {
    return role === 'admin';
}
