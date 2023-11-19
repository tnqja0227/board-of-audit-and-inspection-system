import logger from '../config/winston';
import { Budget, Expense, Income, Organization } from '../model';
import { NotFoundError } from '../utils/errors';

export async function findByOrganizationAndYearAndHalf(
    organization_id: string | number,
    year: string | number,
    half: string,
) {
    logger.info(
        `find budgets by organization: ${organization_id}, year: ${year}, half: ${half}`,
    );

    const organization = await Organization.findByPk(organization_id);
    if (!organization) {
        throw new NotFoundError(
            `${organization_id} 피감기관이 존재하지 않습니다`,
        );
    }

    const budget = await Budget.findOne({
        where: {
            OrganizationId: organization_id,
            year: year,
            half: half,
        },
    });
    if (!budget) {
        throw new NotFoundError(
            `${organization.name}의 ${year}년 ${half} 예산안이 존재하지 않습니다`,
        );
    }

    const incomes = await Income.findAll({
        where: {
            BudgetId: budget.id,
        },
    });

    const incomeSources = incomes.map((income) => income.source);
    const incomeUniqueSources = incomeSources.filter((source, index, array) => {
        return array.indexOf(source) === index;
    });

    const imcomeResult = incomeUniqueSources.map((source) => {
        const filteredBySource = incomes.filter(
            (income) => income.source === source,
        );
        const categories = filteredBySource.map((income) => income.category);
        const uniqueCategories = categories.filter((category, index, array) => {
            return array.indexOf(category) === index;
        });
        const sum = filteredBySource.reduce((acc, cur) => {
            return acc + cur.amount;
        }, 0);
        return {
            재원: source,
            예산총계: sum,
            items: uniqueCategories.map((category) => {
                const filteredByCategory = filteredBySource.filter(
                    (income) => income.category === category,
                );
                return {
                    예산분류: category,
                    items: filteredByCategory.map((income) => {
                        return {
                            항목: income.content,
                            코드: income.code,
                            예산: income.amount,
                        };
                    }),
                };
            }),
        };
    });

    const expenses = await Expense.findAll({
        where: {
            BudgetId: budget.id,
        },
    });

    const expenseSources = expenses.map((expense) => expense.source);
    const expenseUniqueSources = expenseSources.filter(
        (source, index, array) => {
            return array.indexOf(source) === index;
        },
    );
    const expenseResult = expenseUniqueSources.map((source) => {
        const filteredBySource = expenses.filter(
            (expense) => expense.source === source,
        );
        const categories = filteredBySource.map((expense) => expense.category);
        const uniqueCategories = categories.filter((category, index, array) => {
            return array.indexOf(category) === index;
        });
        const sum = filteredBySource.reduce((acc, cur) => {
            return acc + cur.amount;
        }, 0);
        return {
            재원: source,
            예산총계: sum,
            items: uniqueCategories.map((category) => {
                const filteredByCategory = filteredBySource.filter(
                    (expense) => expense.category === category,
                );
                return {
                    예산분류: category,
                    items: filteredByCategory.map((expense) => {
                        return {
                            사업: expense.project,
                            항목: expense.content,
                            코드: expense.code,
                            예산: expense.amount,
                        };
                    }),
                };
            }),
        };
    });

    return {
        id: budget.id,
        담당자: budget.manager,
        연도: budget.year,
        반기: budget.half,
        피감기구: organization.name,
        수입: imcomeResult,
        지출: expenseResult,
    };
}
