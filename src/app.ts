import bodyParser from 'body-parser';
import { config } from 'dotenv';
import express from 'express';
import session from 'express-session';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import logger from './config/winston';
import { initDB } from './db/utils';
import errorHandler from './middleware/error_handler';
import cors from 'cors';
import { redisStore } from './db';
import { createRouter } from './routes';

declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}

config();

const swaggerFile = fs.readFileSync('swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(swaggerFile);

const sessionMiddleware = session({
    store: redisStore,
    secret: (process.env.SESSION_SECRET as string) || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false,
        sameSite: 'none',
        secure: true,
    },
});

const requestLogger = function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) {
    logger.info(`${req.method}, ${req.url}`);
    next();
};

export function createApp() {
    const app = express();

    if (process.env.NODE_ENV !== 'test') {
        initDB()
            .then(() => {
                logger.info('Database connected');
            })
            .catch((err) => {
                logger.error(err);
                throw err;
            });
    }

    app.use(
        cors({
            origin: 'http://localhost:3000',
            methods: ['GET', 'PUT', 'POST', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        }),
    );
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.use(sessionMiddleware);
    app.use(requestLogger);

    app.use(createRouter());
    app.use(errorHandler);

    logger.debug('App created');

    return app;
}
