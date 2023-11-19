import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

export async function validateIsAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const role = req.session.user!.role;
    if (!isAdmin(role)) {
        throw new UnauthorizedError('권한이 없습니다.');
    }
    next();
}

export async function validateOrganization(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const role = req.session.user!.role;
    if (isAdmin(role)) {
        return next();
    }

    const organization = req.session.user!.OrganizationId;
    if (organization !== req.params.organization_id) {
        throw new UnauthorizedError('권한이 없습니다.');
    }
    next();
}

function isAdmin(role: string) {
    return role === 'admin';
}
