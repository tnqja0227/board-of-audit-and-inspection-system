import {
    CreateExpenseDto,
    DeleteExpenseDto,
    FiscalHalfDTO,
    UpdateExpenseDto,
} from '../dto';
import { Expense } from '../model';
import { sequelize } from '../db';

class ExpenseRepository {
    async listExpenses(dto: FiscalHalfDTO) {
        const schemaName = process.env.NODE_ENV || 'development';
        return sequelize.query(
            `SELECT E."id",
                E."code"
            FROM ${schemaName}."budgets" B
                LEFT JOIN ${schemaName}."expenses" E
                ON B."id" = E."BudgetId"
            WHERE B."OrganizationId" = ?
                AND B."year" = ?
                AND B."half" = ?
            ORDER BY E."code"`,
            {
                type: 'SELECT',
                replacements: [dto.organizationId, dto.year, dto.half],
            },
        );
    }

    async createExpense(dto: CreateExpenseDto) {
        const expense = await Expense.create({
            BudgetId: dto.budgetId,
            code: dto.code,
            source: dto.source,
            category: dto.category,
            project: dto.project,
            content: dto.content,
            amount: dto.amount,
            note: dto.note,
        });
        return expense;
    }

    async updateExpense(dto: UpdateExpenseDto) {
        await Expense.update(
            {
                source: dto.source,
                category: dto.category,
                project: dto.project,
                content: dto.content,
                amount: dto.amount,
                note: dto.note,
            },
            {
                where: {
                    id: dto.expenseId,
                },
            },
        );
    }

    async deleteExpense(dto: DeleteExpenseDto) {
        await Expense.destroy({
            where: {
                id: dto.expenseId,
            },
        });
    }
}

export { ExpenseRepository };
