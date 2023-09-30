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

declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}

async function initDB() {
    const models = [Organization, User, Budget, Income, Expense, Transaction];
    for (const model of models) {
        // await model.sync({ force: true });
        // await model.sync();
        await model.sync({ alter: true });
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

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
