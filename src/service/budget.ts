import logger from '../config/winston';
import { sequelize } from '../db';
import { Budget } from '../model';
import { NotFoundError } from '../utils/errors';
import * as OrganizationService from './organization';

export async function findByOrganizationAndYearAndHalf(
    organization_id: string | number,
    year: string | number,
    half: string,
) {
    const budget = await Budget.findOne({
        where: {
            OrganizationId: organization_id,
            year: year,
            half: half,
        },
    });
    if (!budget) {
        throw new NotFoundError(
            `${organization_id}의 ${year}년 ${half} 예산안이 존재하지 않습니다`,
        );
    }
    return budget;
}

export async function getIncomeBudget(
    organization_id: string | number,
    year: string | number,
    half: string,
) {
    logger.info(
        `get settlement by organization: ${organization_id}, year: ${year}, half: ${half}`,
    );

    const organization = await OrganizationService.findById(organization_id);
    const budget = await findByOrganizationAndYearAndHalf(
        organization_id,
        year,
        half,
    );

    const schema_name = process.env.NODE_ENV || 'development';

    const incomes = await sequelize.query(
        `SELECT I."code", I."source", I."category", I."content", I."amount", I."note", 
            sum(T."amount") AS "settlement"
        FROM ${schema_name}."incomes" AS I 
            LEFT JOIN ${schema_name}."transactions" AS T 
            ON I."id" = T."IncomeId"
        WHERE I."BudgetId" = ?
        GROUP BY I."id"`,
        {
            type: 'SELECT',
            replacements: [budget.id],
        },
    );

    const incomeResult = groupBy(incomes, 'source').map((groupedItem) => {
        const categorizedItems = groupBy(groupedItem.items, 'category');
        const budgetSum = categorizedItems.reduce((acc, cur) => {
            return acc + sumByKey(cur.items, 'amount');
        }, 0);
        const settlementSum = categorizedItems.reduce((acc, cur) => {
            return acc + sumByKey(cur.items, 'settlement');
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
                            예산: Number(income.amount) as number,
                            결산: Number(income.settlement) as number,
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

    const incomeBudgetSum = incomeResult.reduce((acc, cur) => {
        return acc + cur.수입소계.예산;
    }, 0);
    const incomeSettlementSum = incomeResult.reduce((acc, cur) => {
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
            비율: Number((incomeSettlementSum / incomeBudgetSum).toFixed(4)),
        },
        수입: incomeResult,
    };
}

export async function getExpenseBudget(
    organization_id: string | number,
    year: string | number,
    half: string,
) {
    logger.info(
        `get settlement by organization: ${organization_id}, year: ${year}, half: ${half}`,
    );

    const organization = await OrganizationService.findById(organization_id);
    const budget = await findByOrganizationAndYearAndHalf(
        organization_id,
        year,
        half,
    );

    const schema_name = process.env.NODE_ENV || 'development';

    const expenses = await sequelize.query(
        `SELECT E."code", E."source", E."category", E."content", E."project", 
            E."amount", E."note", sum(T."amount") AS "settlement"
        FROM ${schema_name}."expenses" AS E 
            LEFT JOIN ${schema_name}."transactions" AS T 
            ON E."id" = T."ExpenseId"
        WHERE E."BudgetId" = ?
        GROUP BY E."id"`,
        {
            type: 'SELECT',
            replacements: [budget.id],
        },
    );

    const expenseResult = groupBy(expenses, 'source').map((groupedItem) => {
        const categorizedItems = groupBy(groupedItem.items, 'category');
        const budgetSum = categorizedItems.reduce((acc, cur) => {
            return acc + sumByKey(cur.items, 'amount');
        }, 0);
        const settlementSum = categorizedItems.reduce((acc, cur) => {
            return acc + sumByKey(cur.items, 'settlement');
        }, 0);
        return {
            재원: groupedItem.source,
            지출소계: {
                예산: budgetSum,
                결산: settlementSum,
                비율: Number((settlementSum / budgetSum).toFixed(4)),
            },
            items: groupBy(groupedItem.items, 'category').map((item) => {
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
            }),
        };
    });

    const expenseBudgetSum = expenseResult.reduce((acc, cur) => {
        return acc + cur.지출소계.예산;
    }, 0);
    const expenseSettlementSum = expenseResult.reduce((acc, cur) => {
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
            비율: Number((expenseSettlementSum / expenseBudgetSum).toFixed(4)),
        },
        지출: expenseResult,
    };
}

export async function getTotalResult(
    organization_id: string | number,
    year: string | number,
    half: string,
) {
    const incomeBudget = await getIncomeBudget(organization_id, year, half);
    const expenseBudget = await getExpenseBudget(organization_id, year, half);

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
                예산: incomeBudget.수입총계.예산 - expenseBudget.지출총계.예산,
                결산: incomeBudget.수입총계.결산 - expenseBudget.지출총계.결산,
            },
        },
        학생회비: getTotalBySource('학생회비'),
        본회계: getTotalBySource('본회계'),
        자치: getTotalBySource('자치'),
    };
}

function getUniqueValuesByKey(array: any[], key: string) {
    return array
        .map((item) => item[key])
        .filter((value, index, array) => {
            return array.indexOf(value) === index;
        });
}

function sumByKey(array: any[], key: string): number {
    return array.reduce((acc, cur) => {
        return acc + Number(cur[key]);
    }, 0);
}

function groupBy(array: any[], key: string) {
    const uniqueValues = getUniqueValuesByKey(array, key);
    return uniqueValues.map((value) => {
        const filtered = array.filter((item) => item[key] === value);
        return {
            [key]: value,
            items: filtered,
        };
    });
}
