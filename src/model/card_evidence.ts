import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class CardEvidence extends Model {
    declare id: number;
    declare organizationId: number;
    declare year: string;
    declare half: string;
    declare key: string;
}

CardEvidence.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        year: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        half: {
            type: DataTypes.ENUM('spring', 'fall'),
            allowNull: false,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        organizationId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'organizations',
                key: 'id',
            },
        },
    },
    {
        tableName: 'card_evidences',
        sequelize,
        indexes: [
            {
                unique: true,
                fields: ['year', 'half', 'organizationId'],
            },
        ],
    },
);

export default CardEvidence;
