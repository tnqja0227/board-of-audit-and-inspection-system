import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';

class Transaction extends Model {
    declare id: number;
    declare projectAt: Date; // 사업일자
    declare manager: string; // 담당자
    declare content: string; // 집행 내용
    declare type: string; // 거래 형태 ('공금카드', '계좌이체', '현금거래', '사비집행')
    declare amount: number; // 금액
    declare transactionAt: Date; // 거래일자
    declare balance: number; // 잔액
    declare accountNumber: string; // 계좌번호
    declare accountBank: string; // 은행명
    declare accountOwner: string; // 예금주
    declare receivingAccountNumber: string; // 입금계좌번호
    declare receivingAccountBank: string; // 입금은행명
    declare receivingAccountOwner: string; // 입금예금주
    declare hasBill: boolean; // 영수증 여부
    declare note: string; // 비고
}

Transaction.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        projectAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        manager: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(
                '공금카드',
                '계좌이체',
                '현금거래',
                '사비집행',
                '기타',
            ),
            allowNull: true,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        transactionAt: {
            type: DataTypes.DATE,
            allowNull: false,
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
        receivingAccountNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        receivingAccountBank: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        receivingAccountOwner: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        hasBill: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: 'transactions',
        sequelize,
    },
);

export default Transaction;
