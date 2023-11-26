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

    // Check if the schema already exists
    const schemaExists = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${schema_name}'`,
        {
            type: QueryTypes.SELECT,
        },
    );

    if (schemaExists.length === 0) {
        // Create the schema if it doesn't exist
        await sequelize.createSchema(schema_name, {});
        logger.debug(`Schema '${schema_name}' created successfully.`);
    } else {
        logger.debug(`Schema '${schema_name}' already exists.`);
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
        } else if (process.env.NODE_ENV === 'development') {
            await model.sync({ alter: true });
        }
        // await model.sync();
    }
}
