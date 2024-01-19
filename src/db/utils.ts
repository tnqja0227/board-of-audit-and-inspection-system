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
    TransactionRecord,
    CardEvidence,
    AccountRecord,
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
        TransactionRecord,
        AccountRecord,
        CardEvidence,
    ];

    for (const model of models) {
        logger.debug(`Syncing ${model.name}`);

        if (
            process.env.NODE_ENV === undefined ||
            process.env.NODE_ENV === 'test'
        ) {
            await model.sync({ force: true });
        } else if (process.env.NODE_ENV === 'development') {
            await model.sync({ alter: true });
        } else {
            // ! It drops columns that are not in the model
            await model.sync({ alter: true });
        }
    }
}
