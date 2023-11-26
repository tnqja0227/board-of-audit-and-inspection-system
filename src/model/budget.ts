import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Budget extends Model {
    declare id: number;
    declare manager: string; // 기구장
    declare year: number; // 예산년도
    declare half: string; // 반기 ('spring', 'fall')
    declare isReadonly: boolean; // 읽기전용 여부
    declare OrganizationId: number;
}

Budget.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        manager: {
            type: DataTypes.STRING,
            allowNull: false,
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
        isReadonly: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: 'budgets',
        sequelize,
        indexes: [
            {
                unique: true,
                fields: ['year', 'half', 'OrganizationId'],
            },
        ],
    },
);

export default Budget;
