import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class ExpenseRecord extends Model {
    declare id: number;
    declare transaction_id: number;
    declare URI: string;
    declare note: string;
}

ExpenseRecord.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        transaction_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'transactions',
                key: 'id',
            },
        },
        URI: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'expense_records',
        sequelize,
    },
);

export default ExpenseRecord;
