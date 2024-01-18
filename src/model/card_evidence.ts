import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class CardEvidence extends Model {
    declare id: number;
    declare organizationId: number;
    declare year: string;
    declare half: string;
    declare uri: string;
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
            type: DataTypes.STRING,
            allowNull: false,
        },
        uri: {
            type: DataTypes.STRING,
            allowNull: false,
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
