import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class User extends Model {
    declare id: number;
    declare email: string;
    declare password: string;
    declare role: string;
    declare cardNumber: string; // 공금카드 번호
    declare cardBank: string; // 공금카드 은행명
    declare cardOwner: string; // 공금카드 예금주
    declare bankbook: string; // 통장사본 (url)
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user',
        },
        cardNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cardBank: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cardOwner: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bankbook: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'users',
        sequelize,
    },
);

export default User;
