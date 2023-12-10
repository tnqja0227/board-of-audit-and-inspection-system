import logger from '../config/winston';
import { sequelize } from '../db';
import { Budget, Expense, Income } from '../model';
import { NotFoundError } from '../utils/errors';
import { Request } from 'express';

const schemaName = process.env.NODE_ENV || 'development';
const integratedTransactionsQuery = `SELECT *
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
            T."manager", T."content", T."amount", T."balance", T."accountNumber", T."accountBank", T."accountOwner", 
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

export async function getTransactions(
    organizationId: string | number,
    year: string | number,
    half: string,
) {
    const query = `WITH integrated_transactions AS (
        ${integratedTransactionsQuery}
    )
    
    SELECT json_build_object('accountNumber', t."accountNumber", 'contents', json_agg(t))
    FROM integrated_transactions AS t
    GROUP BY t."accountNumber"`;
    const transactions = await sequelize.query(query, {
        replacements: {
            organizationId: organizationId,
            year: year,
            half: half,
        },
        type: 'SELECT',
    });
    return transactions.map(
        (transaction: any) => transaction.json_build_object,
    );
}

export async function getIntegratedTransactions(
    organizationId: string | number,
    year: string | number,
    half: string,
) {
    return sequelize.query(integratedTransactionsQuery, {
        replacements: {
            organizationId: organizationId,
            year: year,
            half: half,
        },
        type: 'SELECT',
    });
}

export async function getBudgetPrimaryKey(req: Request) {
    if (req.body.income_id) {
        return findOrganizationByIncomeId(req.body.income_id);
    } else if (req.body.expense_id) {
        return findOrganizationByExpenseId(req.body.expense_id);
    }

    logger.error('Cannot find OrganizationId in request');
    throw new NotFoundError('요청에서 OrganizationId를 찾을 수 없습니다.');
}

async function findOrganizationByBudgetId(budget_id: string | number) {
    const budget = await Budget.findByPk(budget_id);
    if (!budget) {
        logger.error(`Budget ID ${budget_id} is not found}`);
        throw new NotFoundError('예산 ID가 존재하지 않습니다.');
    }
    logger.info(`Organization ${budget.OrganizationId} is found`);
    return Promise.resolve({
        organizationId: budget.OrganizationId,
        year: budget.year,
        half: budget.half,
    });
}

async function findOrganizationByIncomeId(income_id: string | number) {
    const income = await Income.findByPk(income_id);
    if (!income) {
        logger.error(`Income ID ${income_id} is not found}`);
        throw new NotFoundError('수입 ID가 존재하지 않습니다.');
    }
    return findOrganizationByBudgetId(income.BudgetId);
}

async function findOrganizationByExpenseId(expense_id: string | number) {
    const expense = await Expense.findByPk(expense_id);
    if (!expense) {
        logger.error(`Expense ID ${expense_id} is not found}`);
        throw new NotFoundError('지출 ID가 존재하지 않습니다.');
    }
    return findOrganizationByBudgetId(expense.BudgetId);
}
