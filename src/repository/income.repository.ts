import {
    CreateIncomeDto,
    DeleteIncomeDto,
    FiscalHalfDTO,
    UpdateIncomeDto,
} from '../dto';
import { Income } from '../model';
import { sequelize } from '../db';

class IncomeRepository {
    async listIncomes(dto: FiscalHalfDTO) {
        const schemaName = process.env.NODE_ENV || 'development';
        return sequelize.query(
            `SELECT I."id",
                I."code"
            FROM ${schemaName}."budgets" B
                LEFT JOIN ${schemaName}."incomes" I
                ON B."id" = I."BudgetId"
            WHERE B."OrganizationId" = ?
                AND B."year" = ?
                AND B."half" = ?
            ORDER BY I."code"`,
            {
                type: 'SELECT',
                replacements: [dto.organizationId, dto.year, dto.half],
            },
        );
    }

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
