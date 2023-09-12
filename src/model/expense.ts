import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Expense extends Model {
    declare id: number;
    declare source: string; // 재원 (학생회비, 본회계, 자치)
    declare category: string; // 예산 분류 (e.g. 중앙회계, 학교지원금)
    declare project: string; // 사업명
    declare content: string; // 항목 (세부 항목)
    declare amount: number; // 금액
    declare note: string; // 비고
}

Expense.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        source: {
            type: DataTypes.ENUM('학생회비', '본회계', '자치'),
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        project: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'Expenses',
        sequelize,
    },
);

export default Expense;
