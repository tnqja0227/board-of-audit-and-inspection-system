import { CreateIncomeDto, DeleteIncomeDto, UpdateIncomeDto } from '../dto';
import { Income } from '../model';

class IncomeRepository {
    async createIncome(dto: CreateIncomeDto) {
        const income = await Income.create({
            BudgetId: dto.budgetId,
            code: dto.code,
            source: dto.source,
            category: dto.category,
            content: dto.content,
            amount: dto.amount,
            note: dto.note,
        });
        return income;
    }

    async updateIncome(dto: UpdateIncomeDto) {
        await Income.update(
            {
                source: dto.source,
                category: dto.category,
                content: dto.content,
                amount: dto.amount,
                note: dto.note,
            },
            {
                where: {
                    id: dto.incomeId,
                },
            },
        );
    }

    async deleteIncome(dto: DeleteIncomeDto) {
        await Income.destroy({
            where: {
                id: dto.incomeId,
            },
        });
    }
}

export { IncomeRepository };
