import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class AccountRecord extends Model {
    declare id: number;
    declare accountId: number;
    declare key: string;
    declare note: string;
}

AccountRecord.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        accountId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
    },
    {
        tableName: 'account_records',
        sequelize,
    },
);

export default AccountRecord;
