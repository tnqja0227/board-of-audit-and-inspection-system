import { sequelize } from '../db';
import {
    CreateTransactionDto,
    GetTransactionDto,
    UpdateTransactionDto,
} from '../dto';
import { Transaction } from '../model';

class TransactionRepository {
    async findById(transactionId: number | string) {
        return Transaction.findByPk(transactionId);
    }

    async find(dto: GetTransactionDto) {
        return sequelize.query(findAllTransactionsQuery, {
            replacements: {
                organizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
            type: 'SELECT',
        });
    }

    async findAndFormat(dto: GetTransactionDto) {
        const query = `WITH integrated_transactions AS (
            ${findAllTransactionsQuery}
        )
        
        SELECT json_build_object('accountNumber', t."accountNumber", 'contents', json_agg(t))
        FROM integrated_transactions AS t
        GROUP BY t."accountNumber"`;

        const transactions = await sequelize.query(query, {
            replacements: {
                organizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
            type: 'SELECT',
        });
        return transactions.map(
            (transaction: any) => transaction.json_build_object,
        );
    }

    async create(dto: CreateTransactionDto) {
        const transaction = await Transaction.create({
            projectAt: dto.projectAt,
            manager: dto.manager,
            content: dto.content,
            type: dto.type,
            amount: dto.amount,
            balance: dto.balance,
            transactionAt: dto.transactionAt,
            accountNumber: dto.accountNumber,
            accountBank: dto.accountBank,
            accountOwner: dto.accountOwner,
            receivingAccountNumber: dto.receivingAccountNumber,
            receivingAccountBank: dto.receivingAccountBank,
            receivingAccountOwner: dto.receivingAccountOwner,
            hasBill: dto.hasBill,
            note: dto.note,
            IncomeId: dto.incomeId,
            ExpenseId: dto.expenseId,
        });
        return transaction;
    }

    async update(dto: UpdateTransactionDto) {
        await Transaction.update(
            {
                projectAt: dto.projectAt,
                manager: dto.manager,
                content: dto.content,
                type: dto.type,
                amount: dto.amount,
                balance: dto.balance,
                transactionAt: dto.transactionAt,
                accountNumber: dto.accountNumber,
                accountBank: dto.accountBank,
                accountOwner: dto.accountOwner,
                receivingAccountNumber: dto.receivingAccountNumber,
                receivingAccountBank: dto.receivingAccountBank,
                receivingAccountOwner: dto.receivingAccountOwner,
                hasBill: dto.hasBill,
                note: dto.note,
                IncomeId: dto.incomeId,
                ExpenseId: dto.expenseId,
            },
            {
                where: {
                    id: dto.transactionId,
                },
            },
        );
    }

    async updateBalanceById(id: number, balance: number) {
        await Transaction.update(
            {
                balance,
            },
            {
                where: {
                    id,
                },
            },
        );
    }

    async delete(id: number | string) {
        await Transaction.destroy({
            where: {
                id,
            },
        });
    }
}

const schemaName = process.env.NODE_ENV || 'development';
const findAllTransactionsQuery = `SELECT *
FROM
    (
        SELECT T."id", I."code", T."projectAt", T."transactionAt", T."updatedAt", 
            T."manager", T."content", T."amount", T."balance", T."accountNumber", T."accountBank", T."accountOwner", 
            T."receivingAccountNumber", T."receivingAccountBank", T."receivingAccountOwner", 
            T."hasBill", T."note", T."IncomeId", T."ExpenseId"
        FROM ${schemaName}."incomes" AS I 
            INNER JOIN ${schemaName}."transactions" AS T
            ON I.id = T."IncomeId"
        WHERE I."BudgetId" IN (
            SELECT id
            FROM ${schemaName}."budgets"
            WHERE "OrganizationId" = :organizationId AND "year" = :year AND "half" = :half
        )
    ) as TIE
    UNION ALL
    (
        SELECT T."id", E."code", T."projectAt", T."transactionAt", T."updatedAt", 
            T."manager", T."content", T."amount" * -1, T."balance", T."accountNumber", T."accountBank", T."accountOwner", 
            T."receivingAccountNumber", T."receivingAccountBank", T."receivingAccountOwner", 
            T."hasBill", T."note", T."IncomeId", T."ExpenseId"
        FROM ${schemaName}."expenses" AS E
            INNER JOIN ${schemaName}."transactions" AS T
            ON E.id = T."ExpenseId"
        WHERE "BudgetId" IN (
            SELECT id
            FROM ${schemaName}."budgets"
            WHERE "OrganizationId" = :organizationId AND "year" = :year AND "half" = :half
        )
    )
ORDER BY "transactionAt", "updatedAt" DESC`;

export { TransactionRepository };
