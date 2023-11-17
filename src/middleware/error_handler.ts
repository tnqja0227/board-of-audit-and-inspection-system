import { Request, Response, NextFunction } from 'express';

export default async function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    let status = 500;
    if ('code' in err) {
        status = err.code;
    }
    res.status(status).send(err.message);
}
