import express from 'express';
import { redisClient } from './db';
import {
    budgets,
    documents,
    organizations,
    transactions,
    users,
} from './routes';
import bodyParser from 'body-parser';
import session from 'express-session';
import { config } from 'dotenv';
import RedisStore from 'connect-redis';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';
import logger from './config/winston';
import { initDB } from './db/util';

declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}

const app = express();

const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'BAI:',
    ttl: 86400,
});

if (process.env.NODE_ENV !== 'test') {
    initDB()
        .then(() => {
            logger.debug('Database connected');
        })
        .catch((err) => {
            logger.debug(err);
        });
}

config();

const file = fs.readFileSync('swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
    session({
        store: redisStore,
        secret: (process.env.SESSION_SECRET as string) || 'keyboard cat',
        resave: false,
        saveUninitialized: false,
    }),
);
app.use(function (req, res, next) {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(`${req.method}, ${req.url}`);
    }
    next();
});

app.use('/organizations', organizations);
app.use('/budgets', budgets);
app.use('/transactions', transactions);
app.use('/documents', documents);
app.use('/users', users);

app.listen(3000);

export default app;
