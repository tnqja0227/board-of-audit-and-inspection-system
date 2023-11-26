import { QueryTypes } from 'sequelize';
import {
    Organization,
    User,
    Budget,
    Income,
    Expense,
    Transaction,
    AuditPeriod,
} from '../model';
import { schema_name, sequelize } from './postgre';
import logger from '../config/winston';

export async function initDB() {
    logger.debug('Initializing database...');

    const schemas = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${schema_name}'`,
        {
            type: QueryTypes.SELECT,
        },
    );

    if (schemas.length === 0) {
        await sequelize.createSchema(schema_name, {});
    }

    const models = [
        Organization,
        User,
        Budget,
        Income,
        Expense,
        Transaction,
        AuditPeriod,
    ];
    for (const model of models) {
        if (process.env.NODE_ENV === 'test') {
            await model.sync({ force: true });
        } else {
            await model.sync({ alter: true });
        }
    }
}
