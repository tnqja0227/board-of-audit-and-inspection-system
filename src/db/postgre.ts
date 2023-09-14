import { Sequelize } from 'sequelize';

let schema_name;
if (process.env.NODE_ENV === 'development') {
    schema_name = 'development';
} else {
    schema_name = 'production';
}

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
