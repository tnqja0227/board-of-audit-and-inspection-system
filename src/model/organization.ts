import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Organization extends Model {
    declare id: number;
    declare name: string;
}

Organization.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        tableName: 'organizations',
        sequelize,
    },
);

export default Organization;
