import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db';

class AuditPeriod extends Model {
    declare year: number; // 감사년도
    declare half: string; // 반기 ('spring', 'fall')
    declare start: Date; // 시작일
    declare end: Date; // 종료일
}

AuditPeriod.init(
    {
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                len: [4, 4],
            },
            primaryKey: true,
        },
        half: {
            type: DataTypes.ENUM('spring', 'fall'),
            allowNull: false,
            primaryKey: true,
        },
        start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'audit_periods',
        sequelize,
        indexes: [
            {
                unique: true,
                fields: ['year', 'half'],
            },
        ],
    },
);

export default AuditPeriod;
