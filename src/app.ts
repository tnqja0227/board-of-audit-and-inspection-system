import express from 'express';
import { query } from './db';
import { budgets, documents, organizations, transactions } from './routes';
import bodyParser from 'body-parser';

query('SELECT * FROM now()', []).then((res) => {
    console.log(res.rows[0]);
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
    console.log('%s %s %s', req.method, req.url, req.path);
    next();
});

app.use('/organizations', organizations);
app.use('/budgets', budgets);
app.use('/transactions', transactions);
app.use('/documents', documents);

app.listen(3000);
