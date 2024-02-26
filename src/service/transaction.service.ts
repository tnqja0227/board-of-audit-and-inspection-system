import logger from '../config/winston';
import {
    CreateTransactionDto,
    GetTransactionDto,
    UpdateTransactionDto,
} from '../dto';
import { Budget, Expense, Income } from '../model';
import { TransactionRepository } from '../repository';
import { BadRequestError, NotFoundError } from '../utils/errors';

interface TransactionServiceInterface {
    getTransactions(dto: GetTransactionDto): Promise<any[]>;
    getFormattedTransactions(dto: GetTransactionDto): Promise<any[]>;
    create(dto: CreateTransactionDto): Promise<any>;
    update(dto: UpdateTransactionDto): Promise<void>;
    delete(id: string | number): Promise<void>;
}

interface BudgetPrimaryKey {
    organizationId: number;
    year: number;
    half: string;
}

class TransactionService implements TransactionServiceInterface {
    private transactionRepository: TransactionRepository =
        new TransactionRepository();

    async getTransactions(dto: GetTransactionDto) {
        return this.transactionRepository.find(dto);
    }

    async getFormattedTransactions(dto: GetTransactionDto) {
        const transactions =
            await this.transactionRepository.findAndFormat(dto);
        for (var i = 0; i < transactions.length; i++) {
            transactions[i].contents.sort((a: any, b: any) => {
                const at = new Date(a.transactionAt);
                const bt = new Date(b.transactionAt);
                return bt.getTime() - at.getTime();
            });
        }
        return transactions;
    }

    async create(dto: CreateTransactionDto) {
        const key: BudgetPrimaryKey = await this.getBudgetPrimaryKey(dto);
        const getTransactionDto = new GetTransactionDto(
            key.organizationId,
            key.year,
            key.half,
        );
        const transactions = (
            await this.transactionRepository.find(getTransactionDto)
        ).filter((transaction: any) => {
            return transaction.accountNumber === dto.accountNumber;
        });

        const latestBalance = this.calLastestBalance(
            dto.transactionAt,
            transactions,
        );
        const signedAmount = dto.incomeId ? dto.amount : -dto.amount;
        dto.balance = latestBalance + signedAmount;

        const afterTransactions: any[] = transactions.filter(
            (transaction: any) => {
                return (
                    new Date(transaction.transactionAt).getTime() >
                    new Date(dto.transactionAt).getTime()
                );
            },
        );
        await this.updateBalance(signedAmount, afterTransactions);

        return this.transactionRepository.create(dto);
    }

    // DTO의 incomeId 또는 expenseId를 이용하여 BudgetPrimaryKey를 찾는다.
    private async getBudgetPrimaryKey(dto: any): Promise<BudgetPrimaryKey> {
        if (dto.incomeId) {
            return this.findOrganizationByIncomeId(dto.incomeId);
        } else if (dto.expenseId) {
            return this.findOrganizationByExpenseId(dto.expenseId);
        }
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

    private calLastestBalance(
        transactionAt: Date,
        transactions: any[],
    ): number {
        const beforeTransactions = transactions.filter((transaction: any) => {
            return (
                new Date(transaction.transactionAt) < new Date(transactionAt)
            );
        });
        if (beforeTransactions.length === 0) {
            return 0;
        }
        return beforeTransactions[beforeTransactions.length - 1].balance;
    }

    private async updateBalance(signedAmount: number, transactions: any[]) {
        for (const transaction of transactions) {
            await this.transactionRepository.updateBalanceById(
                transaction.id,
                transaction.balance + signedAmount,
            );
        }
    }

    async update(dto: UpdateTransactionDto) {
        this.validateReferenceId(dto);

        const targetTransaction = await this.transactionRepository.findById(
            dto.transactionId,
        );
        const needUpdateBalance =
            dto.amount || dto.transactionAt || dto.incomeId || dto.expenseId;
        if (!needUpdateBalance) {
            return this.transactionRepository.update(dto);
        }

        const key: BudgetPrimaryKey = await this.getBudgetPrimaryKey({
            incomeId: targetTransaction!.IncomeId,
            expenseId: targetTransaction!.ExpenseId,
        });
        const transactions = await this.getExistingTransaction(
            key,
            targetTransaction,
        );

        const oldAmount = targetTransaction!.IncomeId
            ? targetTransaction!.amount
            : -targetTransaction!.amount;
        logger.info(`Subtract ${oldAmount} from balance`);

        transactions.forEach((transaction: any) => {
            if (
                new Date(transaction.transactionAt).getTime() >
                new Date(targetTransaction!.transactionAt).getTime()
            ) {
                transaction.balance -= oldAmount;
            }
        });

        const transactionAt =
            dto.transactionAt || targetTransaction!.transactionAt;
        let signedAmount: number;
        if ((dto.incomeId || dto.expenseId) && dto.amount) {
            signedAmount = dto.incomeId ? dto.amount : -dto.amount;
        } else if (dto.incomeId || dto.expenseId) {
            signedAmount = dto.incomeId
                ? targetTransaction!.amount
                : -targetTransaction!.amount;
        } else if (dto.amount) {
            signedAmount = targetTransaction!.IncomeId
                ? dto.amount
                : -dto.amount;
        } else {
            signedAmount = targetTransaction!.IncomeId
                ? targetTransaction!.amount
                : -targetTransaction!.amount;
        }
        logger.info(`Add ${signedAmount} to balance`);

        const latestBalance = this.calLastestBalance(
            transactionAt,
            transactions,
        );
        dto.balance = latestBalance + signedAmount;

        const afterTransactions = transactions.filter((transaction: any) => {
            return (
                new Date(transaction.transactionAt).getTime() >
                new Date(transactionAt).getTime()
            );
        });
        await this.updateBalance(signedAmount, afterTransactions);
        this.transactionRepository.update(dto);
    }

    private validateReferenceId(dto: UpdateTransactionDto) {
        if (dto.incomeId && dto.expenseId) {
            throw new BadRequestError(
                'income_id와 expense_id 중 하나만 존재해야 합니다.',
            );
        }
    }

    private async getExistingTransaction(key: BudgetPrimaryKey, dto: any) {
        const getTransactionDto = new GetTransactionDto(
            key.organizationId,
            key.year,
            key.half,
        );
        const transactions = (
            await this.transactionRepository.find(getTransactionDto)
        ).filter((transaction: any) => {
            return (
                transaction.accountNumber === dto.accountNumber &&
                transaction.id !== dto.transactionId
            );
        });
        return transactions;
    }

    async delete(id: string | number) {
        await this.transactionRepository.delete(id);
    }
}

export { TransactionService };
