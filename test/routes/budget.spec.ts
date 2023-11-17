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
    });

    describe('GET /:year/:half', function () {
        it('should return budgets of all organizations of the given year and half', async function () {
            const organization1 = await Organization.create({
                name: '학부총학생회',
            });

            const organization2 = await Organization.create({
                name: '감사원',
            });

            const organization3 = await Organization.create({
                name: '동아리연합회',
            });

            await Budget.create({
                OrganizationId: organization1.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            await Budget.create({
                OrganizationId: organization1.id,
                year: 2022,
                half: 'fall',
                manager: '김넙죽',
            });

            await Budget.create({
                OrganizationId: organization2.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            await Budget.create({
                OrganizationId: organization3.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const res = await chai.request(app).get('/budgets/2023/spring');
            expect(res.body.map((budget: any) => budget.organization_name)).eql(
                ['감사원', '동아리연합회', '학부총학생회'],
            );
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
