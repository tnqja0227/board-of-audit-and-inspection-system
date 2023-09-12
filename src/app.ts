import express from 'express';
import { query, redisClient } from './db';
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

declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}

query('SELECT * FROM now()', []).then((res) => {
    console.log(res.rows[0]);
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
