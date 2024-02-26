import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class AccountRecord extends Model {
    declare id: number;
    declare URI: string;
    declare note: string;
    declare AccountId: number;
}

AccountRecord.init(
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
        tableName: 'account_records',
        sequelize,
    },
);

export default AccountRecord;
