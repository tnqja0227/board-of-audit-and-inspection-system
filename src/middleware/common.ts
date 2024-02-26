import { Request, Response, NextFunction } from 'express';
import logger from '../config/winston';

const INTERNAL_SERVER_ERROR = 500;

export async function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    logger.error({ message: err.message, code: err.code });

    const status = err.code || INTERNAL_SERVER_ERROR;
    res.status(status).send(err.message);
}

export const requestLogger = function (
    req: Request,
    res: Response,
    next: NextFunction,
) {
    logger.info(`${req.method}, ${req.url}`);
    next();
};
