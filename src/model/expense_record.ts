import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class ExpenseRecord extends Model {
    declare id: number;
    declare transactionId: number; // 통장 거래 내역 id
    declare key: string; // s3 bucket 상에서 이미지의 key
    declare note: string; // 비고
}

ExpenseRecord.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        transactionId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'transactions',
                key: 'id',
            },
        },
        key: {
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
