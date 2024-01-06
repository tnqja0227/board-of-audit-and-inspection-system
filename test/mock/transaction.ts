export function createMockIncomeTransaction1(incomeId: number | string) {
    return {
        income_id: incomeId,
        project_at: new Date('2023-03-16: 09:00:00'),
        manager: '김넙죽',
        content: '테스트',
        type: '공금카드',
        amount: 50000,
        transaction_at: new Date('2023-03-16 09:00:00'),
        account_number: '1234567890',
        account_bank: '우리은행',
        account_owner: '김넙죽',
    };
}
