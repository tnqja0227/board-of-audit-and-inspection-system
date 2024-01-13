import { CreateIncomeDto, DeleteIncomeDto, UpdateIncomeDto } from '../dto';
import { IncomeRepository } from '../repository';

class IncomeService {
    private incomeRepository: IncomeRepository = new IncomeRepository();

    async createIncome(dto: CreateIncomeDto) {
        const income = await this.incomeRepository.createIncome(dto);
        return income;
    }

    async updateIncome(dto: UpdateIncomeDto) {
        await this.incomeRepository.updateIncome(dto);
    }

    async deleteIncome(dto: DeleteIncomeDto) {
        await this.incomeRepository.deleteIncome(dto);
    }
}

export { IncomeService };
