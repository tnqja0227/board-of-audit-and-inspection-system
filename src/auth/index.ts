import { Request, Response, NextFunction } from 'express';

export function authAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const role = req.session.user!.role;
        if (role !== 'admin') {
            return res.sendStatus(401);
        }
        next();
    } catch (error) {
        next(error);
    }
}
