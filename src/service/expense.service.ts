import { CreateExpenseDto, DeleteExpenseDto, UpdateExpenseDto } from '../dto';
import { ExpenseRepository } from '../repository';

class ExpenseService {
    private expenseRepository: ExpenseRepository = new ExpenseRepository();

    async createExpense(dto: CreateExpenseDto) {
        const expense = await this.expenseRepository.createExpense(dto);
        return expense;
    }

    async updateExpense(dto: UpdateExpenseDto) {
        await this.expenseRepository.updateExpense(dto);
    }

    async deleteExpense(dto: DeleteExpenseDto) {
        await this.expenseRepository.deleteExpense(dto);
    }
}

export { ExpenseService };
