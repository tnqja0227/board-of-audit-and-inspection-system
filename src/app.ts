import express from 'express';
import { query } from './db';
import { budgets, organizations } from './routes';
import bodyParser from 'body-parser';

query('SELECT * FROM now()', []).then((res) => {
    console.log(res.rows[0]);
});

const app = express();
app.use(bodyParser.json());

app.use('/organizations', organizations);
app.use('/budgets', budgets);

app.listen(3000);
