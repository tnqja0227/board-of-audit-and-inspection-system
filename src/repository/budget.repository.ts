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
