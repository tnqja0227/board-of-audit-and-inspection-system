import chaiHttp from 'chai-http';
import app from '../../src/app';
import chai, { expect } from 'chai';
import {
    AuditPeriod,
    Budget,
    Expense,
    Income,
    Organization,
    Transaction,
} from '../../src/model';
import { initDB } from '../../src/db/util';
import sinon from 'sinon';
import { requestAsUser } from './utils';

chai.use(chaiHttp);

const dummyAuditPeriod = {
    year: 2023,
    half: 'spring',
    start: new Date('2023-01-01'),
    end: new Date('2023-06-30'),
};

const validDate = new Date(2023, 3, 1, 0, 0);
const invalidDate = new Date(2023, 7, 1, 0, 0);

describe('API /budgets', function () {
    before(async function () {
        await initDB();
    });

    beforeEach(async function () {
        await AuditPeriod.create(dummyAuditPeriod);
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await Budget.destroy(options);
        await Organization.destroy(options);
        await AuditPeriod.destroy(options);
        await Income.destroy(options);
        await Expense.destroy(options);
    });

    describe('GET /:organization_id/:year/:half', function () {
        it('해당 분기의 모든 예산안을 조회할 수 있다', async function () {
            const organization = await Organization.create({
                name: '학부총학생회',
            });
            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });
            await createDummyBudget(budget.id);

            const agent = chai.request.agent(app);
            agent.post('/users/').send({
                email: 'test@kaist.ac.kr',
                card_number: '1234567890',
                card_bank: '우리은행',
                card_owner: '김넙죽',
                bankbook: '1234567890',
                organization_name: organization.name,
            });
            requestAsUser(agent, 'test@kaist.ac.kr').then(async () => {
                const res = await agent.get(
                    `/budgets/${organization.id}/2023/spring`,
                );
                expect(res.status).eql(200);
                expect(res.body).eql({
                    id: budget.id,
                    담당자: '김넙죽',
                    연도: 2023,
                    반기: 'spring',
                    피감기구: '학부총학생회',
                    수입: [
                        {
                            재원: '학생회비',
                            예산총계: 2356094,
                            items: [
                                {
                                    예산분류: '중앙회계',
                                    items: [
                                        {
                                            항목: '중앙회계 지원금',
                                            코드: '101',
                                            예산: 180000,
                                        },
                                        {
                                            항목: '중앙회계 이월금',
                                            코드: '102',
                                            예산: 632238,
                                        },
                                    ],
                                },
                                {
                                    예산분류: '격려기금',
                                    items: [
                                        {
                                            항목: '격려금',
                                            코드: '103',
                                            예산: 1543856,
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            재원: '자치',
                            예산총계: 2000,
                            items: [
                                {
                                    예산분류: '예금이자',
                                    items: [
                                        {
                                            항목: '예금이자',
                                            코드: '301',
                                            예산: 2000,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    지출: [
                        {
                            재원: '학생회비',
                            예산총계: 1843856,
                            items: [
                                {
                                    예산분류: '운영비',
                                    items: [
                                        {
                                            사업: '격려기금',
                                            항목: '격려금',
                                            코드: '401',
                                            예산: 1543856,
                                        },
                                    ],
                                },
                                {
                                    예산분류: '정기사업비',
                                    items: [
                                        {
                                            사업: '감사원 LT',
                                            항목: '복리후생비',
                                            코드: '402',
                                            예산: 120000,
                                        },
                                    ],
                                },
                                {
                                    예산분류: '회의비',
                                    items: [
                                        {
                                            사업: '감사원 회의',
                                            항목: '회의비',
                                            코드: '403',
                                            예산: 120000,
                                        },
                                    ],
                                },
                                {
                                    예산분류: '비정기사업비',
                                    items: [
                                        {
                                            사업: '사무소모품 및 유지',
                                            항목: '복리후생비',
                                            코드: '404',
                                            예산: 60000,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
            });
        });
    });

    describe('GET /report/income/:organization_id/:year/:half', function () {
        it('should return income budgets of the given organization, year, and half', async function () {
            const organization = await Organization.create({
                name: '학부총학생회',
            });

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const income1 = await Income.create({
                BudgetId: budget.id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
            });

            const income2 = await Income.create({
                BudgetId: budget.id,
                code: '102',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 100000,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '학생회비',
                amount: 300000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                IncomeId: income1.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '학생회비',
                amount: 50000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                IncomeId: income2.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '학생회비',
                amount: 30000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                IncomeId: income2.id,
            });

            const res = await chai
                .request(app)
                .get(`/budgets/report/income/${organization.id}/2023/spring`);

            expect(res.body[0]).eql({
                source: '학생회비',
                '예산 소계': '300000',
                '결산 소계': '380000',
                비율: 1.2666666666666666,
                json_agg: [
                    {
                        '예산 분류': '중앙회계',
                        항목: '중앙회계지원금',
                        예산: 200000,
                        결산: 300000,
                        비율: 1.5,
                        비고: null,
                        코드: '101',
                    },
                    {
                        '예산 분류': '중앙회계',
                        항목: '중앙회계지원금',
                        예산: 100000,
                        결산: 80000,
                        비율: 0.8,
                        비고: null,
                        코드: '102',
                    },
                ],
            });
        });
    });

    describe('GET /report/expense/:organization_id/:year/:half', function () {
        it('should return expense budgets of the given organization, year, and half', async function () {
            const organization = await Organization.create({
                name: '학부총학생회',
            });

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const expense1 = await Expense.create({
                BudgetId: budget.id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 100000,
            });

            const expense2 = await Expense.create({
                BudgetId: budget.id,
                code: '501',
                source: '본회계',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 100000,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '회식비',
                type: '공금카드',
                amount: 150000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                ExpenseId: expense1.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '교통비',
                type: '공금카드',
                amount: 30000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                ExpenseId: expense1.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '운영 지원금',
                type: '공금카드',
                amount: 150000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                ExpenseId: expense2.id,
            });

            const res = await chai
                .request(app)
                .get(`/budgets/report/expense/${organization.id}/2023/spring`);

            expect(res.body[0]).eql({
                source: '학생회비',
                '예산 소계': '100000',
                '결산 소계': '180000',
                비율: 1.8,
                json_agg: [
                    {
                        '예산 분류': '운영비',
                        항목: '격려금',
                        사업: '격려금',
                        예산: 100000,
                        결산: 180000,
                        비율: 1.8,
                        비고: null,
                        코드: '401',
                    },
                ],
            });
            expect(res.body[1]).eql({
                source: '본회계',
                '예산 소계': '100000',
                '결산 소계': '150000',
                비율: 1.5,
                json_agg: [
                    {
                        '예산 분류': '운영비',
                        항목: '격려금',
                        사업: '격려금',
                        예산: 100000,
                        결산: 150000,
                        비율: 1.5,
                        비고: null,
                        코드: '501',
                    },
                ],
            });
        });
    });

    describe('GET /report/total/:organization_id/:year/:half', function () {
        it('should return total income and expense of the given organization, year, and half', async function () {
            const organization = await Organization.create({
                name: '학부총학생회',
            });

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const income1 = await Income.create({
                BudgetId: budget.id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const expense1 = await Expense.create({
                BudgetId: budget.id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 100000,
                note: '',
            });

            const expense2 = await Expense.create({
                BudgetId: budget.id,
                code: '501',
                source: '본회계',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 100000,
                note: '',
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '학생회비',
                amount: 300000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                note: '',
                IncomeId: income1.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '회식비',
                type: '공금카드',
                amount: 150000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                note: '',
                ExpenseId: expense1.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '교통비',
                type: '공금카드',
                amount: 30000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                note: '',
                ExpenseId: expense1.id,
            });

            await Transaction.create({
                projectAt: new Date('2023-04-01'),
                manager: '김넙죽',
                content: '운영 지원금',
                type: '공금카드',
                amount: 150000,
                transactionAt: new Date('2023-04-01'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                hasBill: true,
                note: '',
                ExpenseId: expense2.id,
            });

            const res = await chai
                .request(app)
                .get(`/budgets/report/total/${organization.id}/2023/spring`);

            expect(res.body[0]).eql({
                '자금 출처': '학생회비',
                수입예산: '200000',
                지출예산: '100000',
                '예산 잔액': '100000',
                수입결산: '300000',
                지출결산: '180000',
                '결산 잔액': '120000',
                수입비율: 1.5,
                지출비율: 1.8,
            });
            expect(res.body[1]).eql({
                '자금 출처': '본회계',
                수입예산: '0',
                지출예산: '100000',
                '예산 잔액': '-100000',
                수입결산: '0',
                지출결산: '150000',
                '결산 잔액': '-150000',
                수입비율: null,
                지출비율: 1.5,
            });
        });
    });

    describe('POST /:organization_id/:year/:half', function () {
        var organization: Organization;
        var clock: sinon.SinonFakeTimers;

        beforeEach(async function () {
            organization = await Organization.create({
                name: '학부총학생회',
            });
        });

        afterEach(function () {
            clock.restore();
        });

        it('should create a new budget', async function () {
            clock = sinon.useFakeTimers(validDate);

            const res = await chai
                .request(app)
                .post(`/budgets/${organization.id}/2023/spring`)
                .send({
                    manager: '김넙죽',
                });

            expect(res.body.manager).eql('김넙죽');
            expect(res.body.OrganizationId).eql(organization.id);
            expect(res.body.year).eql(2023);
            expect(res.body.half).eql('spring');
        });

        it('should not create a new budget if the audit period is not valid', async function () {
            clock = sinon.useFakeTimers(invalidDate);

            const res = await chai
                .request(app)
                .post(`/budgets/${organization.id}/2023/spring`)
                .send({
                    manager: '김넙죽',
                });

            expect(res.status).eql(403);
        });
    });

    describe('DELETE /:organization_id/:year/:half', function () {
        var organization: Organization;
        var clock: sinon.SinonFakeTimers;

        beforeEach(async function () {
            organization = await Organization.create({
                name: '학부총학생회',
            });
        });

        afterEach(function () {
            clock.restore();
        });

        it('should delete a budget', async function () {
            clock = sinon.useFakeTimers(validDate);

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/${organization.id}/2023/spring`);

            expect(res.status).eql(200);
            expect(await Budget.findByPk(budget.id)).eql(null);
        });

        it('should not delete a budget if the audit period is not valid', async function () {
            clock = sinon.useFakeTimers(invalidDate);

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/${organization.id}/2023/spring`);

            expect(res.status).eql(403);

            const foundBudget = await Budget.findByPk(budget.id);
            expect(foundBudget?.id).eql(budget.id);
        });
    });
});

async function createDummyBudget(budget_id: string | number) {
    await Income.create({
        BudgetId: budget_id,
        code: '101',
        source: '학생회비',
        category: '중앙회계',
        content: '중앙회계 지원금',
        amount: 180000,
    });

    await Income.create({
        BudgetId: budget_id,
        code: '102',
        source: '학생회비',
        category: '중앙회계',
        content: '중앙회계 이월금',
        amount: 632238,
    });

    await Income.create({
        BudgetId: budget_id,
        code: '103',
        source: '학생회비',
        category: '격려기금',
        content: '격려금',
        amount: 1543856,
    });

    await Income.create({
        BudgetId: budget_id,
        code: '301',
        source: '자치',
        category: '예금이자',
        content: '예금이자',
        amount: 2000,
    });

    await Expense.create({
        BudgetId: budget_id,
        code: '401',
        source: '학생회비',
        category: '운영비',
        project: '격려기금',
        content: '격려금',
        amount: 1543856,
    });

    await Expense.create({
        BudgetId: budget_id,
        code: '402',
        source: '학생회비',
        category: '정기사업비',
        project: '감사원 LT',
        content: '복리후생비',
        amount: 120000,
    });

    await Expense.create({
        BudgetId: budget_id,
        code: '403',
        source: '학생회비',
        category: '회의비',
        project: '감사원 회의',
        content: '회의비',
        amount: 120000,
    });

    await Expense.create({
        BudgetId: budget_id,
        code: '404',
        source: '학생회비',
        category: '비정기사업비',
        project: '사무소모품 및 유지',
        content: '복리후생비',
        amount: 60000,
    });
}
