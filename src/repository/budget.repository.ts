import { BudgetRequestDto } from '../dto';
import { Budget } from '../model';
import { NotFoundError } from '../utils/errors';

class BudgetRepository {
    async findBudget(dto: BudgetRequestDto) {
        const budget = await Budget.findOne({
            where: {
                OrganizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
        });
        if (!budget) {
            throw new NotFoundError(
                `${dto.organizationId}의 ${dto.year}년 ${dto.half} 예산안이 존재하지 않습니다`,
            );
        }
        return budget;
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
