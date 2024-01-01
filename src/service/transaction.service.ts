import logger from '../config/winston';
import {
    CreateTransactionDto,
    GetTransactionDto,
    UpdateTransactionDto,
} from '../dto';
import { Budget, Expense, Income } from '../model';
import { TransactionRepository } from '../repository';
import { BadRequestError, NotFoundError } from '../utils/errors';

class TransactionService {
    private transactionRepository: TransactionRepository =
        new TransactionRepository();

    async getTransactions(dto: GetTransactionDto) {
        return this.transactionRepository.find(dto);
    }

    async getFormattedTransactions(dto: GetTransactionDto) {
        return this.transactionRepository.findAndFormat(dto);
    }

    async create(dto: CreateTransactionDto) {
        const { organizationId, year, half } =
            await this.getBudgetPrimaryKey(dto);

        const getTransactionDto = new GetTransactionDto(
            organizationId,
            year,
            half,
        );
        const transactions =
            await this.transactionRepository.find(getTransactionDto);

        const latestBalance = this.calLastestBalance(dto, transactions);
        const signedAmount = dto.incomeId ? dto.amount : -dto.amount;
        const balance = latestBalance + signedAmount;

        dto.balance = balance;
        this.updateBalance(dto, transactions);
        return this.transactionRepository.create(dto);
    }

    private calLastestBalance(
        dto: CreateTransactionDto,
        transactions: any[],
    ): number {
        const beforeTransactions = transactions.filter((transaction: any) => {
            return (
                new Date(transaction.transactionAt) <=
                new Date(dto.transactionAt)
            );
        });
        if (beforeTransactions.length === 0) {
            return 0;
        }
        return beforeTransactions[beforeTransactions.length - 1].balance;
    }

    private async updateBalance(dto: CreateTransactionDto, transactions: any) {
        const signedAmount = dto.incomeId ? dto.amount : -dto.amount;
        const afterTransactions: any[] = transactions.filter(
            async (transaction: any) => {
                return (
                    new Date(transaction.transactionAt) >
                    new Date(dto.transactionAt)
                );
            },
        );
        for (const transaction of afterTransactions) {
            await this.transactionRepository.updateBalanceById(
                transaction.id,
                transaction.balance + signedAmount,
            );
        }
    }

    private async getBudgetPrimaryKey(dto: CreateTransactionDto) {
        if (dto.incomeId) {
            return this.findOrganizationByIncomeId(dto.incomeId);
        } else if (dto.expenseId) {
            return this.findOrganizationByExpenseId(dto.expenseId);
        }

        logger.error('Cannot find OrganizationId in request');
        throw new NotFoundError('요청에서 OrganizationId를 찾을 수 없습니다.');
    }

    private async findOrganizationByBudgetId(budget_id: string | number) {
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

    private async findOrganizationByIncomeId(incomeId: string | number) {
        const income = await Income.findByPk(incomeId);
        if (!income) {
            logger.error(`Income ID ${incomeId} is not found}`);
            throw new NotFoundError('수입 ID가 존재하지 않습니다.');
        }
        return this.findOrganizationByBudgetId(income.BudgetId);
    }

    private async findOrganizationByExpenseId(expenseId: string | number) {
        const expense = await Expense.findByPk(expenseId);
        if (!expense) {
            logger.error(`Expense ID ${expenseId} is not found}`);
            throw new NotFoundError('지출 ID가 존재하지 않습니다.');
        }
        return this.findOrganizationByBudgetId(expense.BudgetId);
    }

    async update(dto: UpdateTransactionDto) {
        this.validateReferenceId(dto);
        this.transactionRepository.update(dto);
    }

    private validateReferenceId(dto: UpdateTransactionDto) {
        if (dto.incomeId && dto.expenseId) {
            throw new BadRequestError(
                'income_id와 expense_id 중 하나만 존재해야 합니다.',
            );
        }
    }

    async delete(id: string | number) {
        await this.transactionRepository.delete(id);
    }
}

export { TransactionService };
