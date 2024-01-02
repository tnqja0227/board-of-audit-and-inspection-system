import logger from '../config/winston';
import { BudgetRepository, OrganizationRepository } from '../repository';
import { BudgetRequestDto } from '../dto';
import { NotFoundError } from '../utils/errors';

class BudgetService {
    private organizationRepository: OrganizationRepository =
        new OrganizationRepository();
    private budgetRepository: BudgetRepository = new BudgetRepository();

    async findBudget(dto: BudgetRequestDto) {
        const budget = await this.budgetRepository.findBudget(dto);
        if (!budget) {
            throw new NotFoundError(
                `${dto.organizationId}의 ${dto.year}년 ${dto.half} 예산안이 존재하지 않습니다`,
            );
        }
        return budget;
    }

    async createBudget(dto: BudgetRequestDto, manager: string) {
        return this.budgetRepository.createBudget(dto, manager);
    }

    async deleteBudget(dto: BudgetRequestDto) {
        return this.budgetRepository.deleteBudget(dto);
    }

    async getIncomeBudget(dto: BudgetRequestDto) {
        logger.info(
            `get income budget of organization: ${dto.organizationId}, year: ${dto.year}, half: ${dto.half}`,
        );

        const organization = await this.organizationRepository.findById(
            dto.organizationId,
        );
        if (!organization) {
            throw new NotFoundError(
                `${dto.organizationId} 피감기관이 존재하지 않습니다`,
            );
        }

        const budget = await this.findBudget(dto);

        const incomeWithSettlement =
            await this.budgetRepository.findIncomeWithSettlement(budget.id);
        const formattedIncome = this.groupBy(
            incomeWithSettlement,
            'source',
        ).map((groupedItem) => {
            const categorizedItems = this.groupBy(
                groupedItem.items,
                'category',
            );
            const budgetSum = categorizedItems.reduce((acc, cur) => {
                return acc + this.sumByKey(cur.items, 'amount');
            }, 0);
            const settlementSum = categorizedItems.reduce((acc, cur) => {
                return acc + this.sumByKey(cur.items, 'settlement');
            }, 0);

            return {
                재원: groupedItem.source as string,
                수입소계: {
                    예산: budgetSum,
                    결산: settlementSum,
                    비율: Number((settlementSum / budgetSum).toFixed(4)),
                },
                items: categorizedItems.map((item) => {
                    return {
                        예산분류: item.category as string,
                        items: item.items.map((income) => {
                            return {
                                항목: income.content as string,
                                코드: income.code as string,
                                예산: Number(income.amount),
                                결산: Number(income.settlement),
                                비율: Number(
                                    (
                                        Number(income.settlement) /
                                        Number(income.amount)
                                    ).toFixed(4),
                                ),
                                비고: (income.note || '') as string,
                            };
                        }),
                    };
                }),
            };
        });

        const incomeBudgetSum = formattedIncome.reduce((acc, cur) => {
            return acc + cur.수입소계.예산;
        }, 0);
        const incomeSettlementSum = formattedIncome.reduce((acc, cur) => {
            return acc + cur.수입소계.결산;
        }, 0);
        return {
            id: budget.id,
            담당자: budget.manager,
            연도: budget.year,
            반기: budget.half,
            피감기구: organization.name,
            수입총계: {
                예산: incomeBudgetSum,
                결산: incomeSettlementSum,
                비율: Number(
                    (incomeSettlementSum / incomeBudgetSum).toFixed(4),
                ),
            },
            수입: formattedIncome,
        };
    }

    async getExpenseBudget(dto: BudgetRequestDto) {
        logger.info(
            `get expense budget by organization: ${dto.organizationId}, year: ${dto.year}, half: ${dto.half}`,
        );

        const organization = await this.organizationRepository.findById(
            dto.organizationId,
        );
        if (!organization) {
            throw new NotFoundError(
                `${dto.organizationId} 피감기관이 존재하지 않습니다`,
            );
        }

        const budget = await this.findBudget(dto);

        const expenseWithSettlement =
            await this.budgetRepository.findExpenseWithSettlement(budget.id);
        const formattedExpense = this.groupBy(
            expenseWithSettlement,
            'source',
        ).map((groupedItem) => {
            const categorizedItems = this.groupBy(
                groupedItem.items,
                'category',
            );
            const budgetSum = categorizedItems.reduce((acc, cur) => {
                return acc + this.sumByKey(cur.items, 'amount');
            }, 0);
            const settlementSum = categorizedItems.reduce((acc, cur) => {
                return acc + this.sumByKey(cur.items, 'settlement');
            }, 0);
            return {
                재원: groupedItem.source,
                지출소계: {
                    예산: budgetSum,
                    결산: settlementSum,
                    비율: Number((settlementSum / budgetSum).toFixed(4)),
                },
                items: this.groupBy(groupedItem.items, 'category').map(
                    (item) => {
                        return {
                            예산분류: item.category,
                            items: item.items.map((expense) => {
                                return {
                                    사업: expense.project,
                                    항목: expense.content,
                                    코드: expense.code,
                                    예산: Number(expense.amount),
                                    결산: Number(expense.settlement),
                                    비율: Number(
                                        (
                                            Number(expense.settlement) /
                                            Number(expense.amount)
                                        ).toFixed(4),
                                    ),

                                    비고: expense.note || '',
                                };
                            }),
                        };
                    },
                ),
            };
        });

        const expenseBudgetSum = formattedExpense.reduce((acc, cur) => {
            return acc + cur.지출소계.예산;
        }, 0);
        const expenseSettlementSum = formattedExpense.reduce((acc, cur) => {
            return acc + cur.지출소계.결산;
        }, 0);
        return {
            id: budget.id,
            담당자: budget.manager,
            연도: budget.year,
            반기: budget.half,
            피감기구: organization.name,
            지출총계: {
                예산: expenseBudgetSum,
                결산: expenseSettlementSum,
                비율: Number(
                    (expenseSettlementSum / expenseBudgetSum).toFixed(4),
                ),
            },
            지출: formattedExpense,
        };
    }

    async getTotal(dto: BudgetRequestDto) {
        const incomeBudget = await this.getIncomeBudget(dto);
        const expenseBudget = await this.getExpenseBudget(dto);

        const ratio = (numerator: number, denominator: number) => {
            if (denominator === 0) {
                return '-';
            }
            return Number((numerator / denominator).toFixed(4));
        };

        const getTotalBySource = (source: string) => {
            const incomeBySource = incomeBudget.수입.filter((item) => {
                return item.재원 === source;
            });
            const expenseBySource = expenseBudget.지출.filter((item) => {
                return item.재원 === source;
            });

            const incomeBudgetSum = incomeBySource.reduce((acc, cur) => {
                return acc + cur.수입소계.예산;
            }, 0);
            const incomeSettlementSum = incomeBySource.reduce((acc, cur) => {
                return acc + cur.수입소계.결산;
            }, 0);
            const expenseBudgetSum = expenseBySource.reduce((acc, cur) => {
                return acc + cur.지출소계.예산;
            }, 0);
            const expenseSettlementSum = expenseBySource.reduce((acc, cur) => {
                return acc + cur.지출소계.결산;
            }, 0);

            return {
                수입: {
                    예산: incomeBudgetSum,
                    결산: incomeSettlementSum,
                    비율: ratio(incomeSettlementSum, incomeBudgetSum),
                },
                지출: {
                    예산: expenseBudgetSum,
                    결산: expenseSettlementSum,
                    비율: ratio(expenseSettlementSum, expenseBudgetSum),
                },
                잔액: {
                    예산: incomeBudgetSum - expenseBudgetSum,
                    결산: incomeSettlementSum - expenseSettlementSum,
                },
            };
        };

        return {
            id: incomeBudget.id,
            담당자: incomeBudget.담당자,
            연도: incomeBudget.연도,
            반기: incomeBudget.반기,
            피감기구: incomeBudget.피감기구,
            총계: {
                수입: {
                    예산: incomeBudget.수입총계.예산,
                    결산: incomeBudget.수입총계.결산,
                    비율: ratio(
                        incomeBudget.수입총계.결산,
                        incomeBudget.수입총계.예산,
                    ),
                },
                지출: {
                    예산: expenseBudget.지출총계.예산,
                    결산: expenseBudget.지출총계.결산,
                    비율: ratio(
                        expenseBudget.지출총계.결산,
                        expenseBudget.지출총계.예산,
                    ),
                },
                잔액: {
                    예산:
                        incomeBudget.수입총계.예산 -
                        expenseBudget.지출총계.예산,
                    결산:
                        incomeBudget.수입총계.결산 -
                        expenseBudget.지출총계.결산,
                },
            },
            학생회비: getTotalBySource('학생회비'),
            본회계: getTotalBySource('본회계'),
            자치: getTotalBySource('자치'),
        };
    }

    // array를 key 기준으로 group한다.
    private groupBy(array: any[], key: string) {
        const uniqueValues = this.getUniqueValuesByKey(array, key);
        return uniqueValues.map((value) => {
            const filtered = array.filter((item) => item[key] === value);
            return {
                [key]: value,
                items: filtered,
            };
        });
    }

    // 각 원소의 key에 해당하는 원소들을 중복없이 반환
    private getUniqueValuesByKey(array: any[], key: string) {
        return array
            .map((item) => item[key])
            .filter((value, index, array) => {
                return array.indexOf(value) === index;
            });
    }

    // array의 key에 해당하는 원소들을 모두 더한 값을 반환
    private sumByKey(array: any[], key: string): number {
        return array.reduce((acc, cur) => {
            return acc + Number(cur[key]);
        }, 0);
    }
}

export { BudgetService };
