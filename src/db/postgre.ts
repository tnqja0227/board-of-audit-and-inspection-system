import { QueryTypes, Sequelize } from 'sequelize';
import {
    Organization,
    User,
    Budget,
    Income,
    Expense,
    Transaction,
    AuditPeriod,
} from '../model';

let schema_name: string;
if (process.env.NODE_ENV !== undefined) {
    schema_name = process.env.NODE_ENV;
} else {
    schema_name = 'development';
}

console.log('schema_name: ', schema_name);

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

export async function initDB() {
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
        console.log(`Schema '${schema_name}' created successfully.`);
    } else {
        console.log(`Schema '${schema_name}' already exists.`);
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
        await model.sync({ force: true });
        // await model.sync();
        // await model.sync({ alter: true });
    }
}
