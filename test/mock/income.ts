export function createMockIncome1(budgetId: number | string) {
    return {
        BudgetId: budgetId,
        code: '101',
        source: '학생회비',
        category: '중앙회계',
        content: '중앙회계 지원금',
        amount: 180000,
    };
}
