import { Sequelize } from 'sequelize';
import logger from '../config/winston';

export let schema_name: string;
if (process.env.NODE_ENV !== undefined) {
    schema_name = process.env.NODE_ENV;
} else {
    schema_name = 'development';
}

logger.debug('schema_name: ', schema_name);

export const sequelize = new Sequelize(
    'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: false,
        schema: schema_name,
    },
);

sequelize.authenticate().catch((err) => {
    console.error('Unable to connect to the database:', err);
});
