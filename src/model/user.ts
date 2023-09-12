import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class User extends Model {
    declare id: number;
    declare email: string;
    declare password: string;
    declare role: string;
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
    },
    {
        tableName: 'users',
        sequelize,
    },
);

export default User;
