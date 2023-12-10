import { QueryTypes } from 'sequelize';
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

    logger.info(`Syncing database with schema: ${schema_name}`);
    if (process.env.NODE_ENV === 'test') {
        await sequelize.sync({ force: true, schema: schema_name });
    } else {
        await sequelize.sync({ schema: schema_name });
    }
}
