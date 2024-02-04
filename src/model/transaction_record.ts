import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class TransactionRecord extends Model {
    declare id: number;
    declare URI: string;
    declare note: string;
    declare TransactionId: number;
}

TransactionRecord.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        URI: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'transaction_records',
        sequelize,
    },
);

export default TransactionRecord;
