import { Sequelize } from 'sequelize';
import logger from '../config/winston';

export const schema_name = process.env.NODE_ENV || 'test';
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
    logger.error('Unable to connect to the PostgreSQL database:');
    throw err;
});
