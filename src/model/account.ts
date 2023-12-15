import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Account extends Model {
    declare id: number;
    declare year: number;
    declare half: string;
    declare name: string; // 계좌 이름
    declare accountNumber: string; // 계좌번호
    declare accountBank: string; // 은행명
    declare accountOwner: string; // 예금주
    declare OrganizationId: number;
}

Account.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                len: [4, 4],
            },
        },
        half: {
            type: DataTypes.ENUM('spring', 'fall'),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountBank: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountOwner: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'accounts',
        sequelize,
        indexes: [
            {
                unique: true,
                fields: ['year', 'half', 'OrganizationId'],
            },
        ],
    },
);

export default Account;
