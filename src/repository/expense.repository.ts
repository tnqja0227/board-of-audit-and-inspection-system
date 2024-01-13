import { CreateExpenseDto, DeleteExpenseDto, UpdateExpenseDto } from '../dto';
import { Expense } from '../model';

class ExpenseRepository {
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
