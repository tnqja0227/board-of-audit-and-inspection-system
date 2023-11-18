import { Request, Response, NextFunction } from 'express';

const INTERNAL_SERVER_ERROR = 500;

export default async function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const status = err.code || INTERNAL_SERVER_ERROR;
    res.status(status).send(err.message);
}
