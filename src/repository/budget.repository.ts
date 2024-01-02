import { sequelize } from '../db';
import { BudgetRequestDto } from '../dto';
import { Budget } from '../model';

class BudgetRepository {
    async findBudget(dto: BudgetRequestDto) {
        return Budget.findOne({
            where: {
                OrganizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
        });
    }

    async findIncomeWithSettlement(budgetId: number) {
        const schemaName = process.env.NODE_ENV || 'development';
        return sequelize.query(
            `SELECT I."code", 
                I."source", 
                I."category", 
                I."content", 
                I."amount", 
                I."note", 
                sum(T."amount") AS "settlement"
            FROM ${schemaName}."incomes" I 
                LEFT JOIN ${schemaName}."transactions" T 
                ON I."id" = T."IncomeId"
            WHERE I."BudgetId" = ?
            GROUP BY I."id"`,
            {
                type: 'SELECT',
                replacements: [budgetId],
            },
        );
    }

    async findExpenseWithSettlement(budgetId: number) {
        const schemaName = process.env.NODE_ENV || 'development';
        return sequelize.query(
            `SELECT E."code", 
                E."source", 
                E."category", 
                E."content", 
                E."project", 
                E."amount", 
                E."note", 
                sum(T."amount") AS "settlement"
            FROM ${schemaName}."expenses" E 
                LEFT JOIN ${schemaName}."transactions" T 
                ON E."id" = T."ExpenseId"
            WHERE E."BudgetId" = ?
            GROUP BY E."id"`,
            {
                type: 'SELECT',
                replacements: [budgetId],
            },
        );
    }

    async createBudget(dto: BudgetRequestDto, manager: string) {
        const budget = await Budget.create({
            OrganizationId: dto.organizationId,
            year: dto.year,
            half: dto.half,
            manager,
        });
        return budget;
    }

    async deleteBudget(dto: BudgetRequestDto) {
        await Budget.destroy({
            where: {
                OrganizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
        });
    }
}

export { BudgetRepository };
