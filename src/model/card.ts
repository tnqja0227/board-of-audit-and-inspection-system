import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Card extends Model {
    declare id: number;
    declare year: number;
    declare half: string;
    declare name: string; // 카드 이름
    declare cardNumber: string; // 카드번호
    declare OrganizationId: number;
}

Card.init(
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
        cardNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'cards',
        sequelize,
        indexes: [
            {
                unique: true,
                fields: ['year', 'half', 'OrganizationId'],
            },
        ],
    },
);

export default Card;
