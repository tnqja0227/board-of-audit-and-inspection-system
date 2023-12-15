import logger from '../config/winston';
import { sequelize } from './postgre';
import { schemaName } from '../utils/common';
import {
    Account,
    AuditPeriod,
    Budget,
    Expense,
    Income,
    Organization,
    Transaction,
    User,
} from '../model';

export async function initDB() {
    logger.info('Initializing postgres database');

    try {
        await sequelize.createSchema(schemaName, {});
    } catch (err) {
        logger.debug(err);
    }

    const models = [
        Organization,
        User,
        Budget,
        Income,
        Expense,
        Transaction,
        AuditPeriod,
        Account,
    ];

    for (const model of models) {
        if (process.env.NODE_ENV === 'test') {
            await model.sync({ force: true });
        } else if (process.env.NODE_ENV === 'development') {
            await model.sync({ alter: true });
        } else {
            await model.sync();
        }
    }
}
