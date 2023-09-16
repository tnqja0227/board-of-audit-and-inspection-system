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
import {
    Organization,
    User,
    Budget,
    Income,
    Expense,
    Transaction,
} from './model';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';

declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}

async function initDB() {
    // TODO: change schema name according to environmental variable
    // sequelize.createSchema('development', {}).catch((err) => {
    //     console.log(err);
    // });

    const models = [Organization, User, Budget, Income, Expense, Transaction];
    for (const model of models) {
        // TODO: change schema name according to environmental variable
        // await model.sync({ force: true });
        await model.sync();
    }
}

initDB().catch((err) => {
    console.log(err);
});

const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'BAI:',
    ttl: 86400,
});

config();

const file = fs.readFileSync('swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
    session({
        store: redisStore,
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
    }),
);
app.use(function (req, res, next) {
    console.log('%s %s %s', req.method, req.url, req.path);
    next();
});

app.use('/organizations', organizations);
app.use('/budgets', budgets);
app.use('/transactions', transactions);
app.use('/documents', documents);
app.use('/users', users);

app.listen(3000);
