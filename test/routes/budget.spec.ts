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

describe('budget router', () => {
    var clock: sinon.SinonFakeTimers;

    before(async function () {
        await initDB();
    });

    beforeEach(async () => {
        await AuditPeriod.create({
            year: 2023,
            half: 'spring',
            start: new Date('2023-01-01'),
            end: new Date('2023-06-30'),
        });

        clock = sinon.useFakeTimers({
            now: new Date(2023, 3, 1, 0, 0),
        });
    });

    afterEach(async () => {
        await Budget.destroy({
            truncate: true,
            cascade: true,
        });
        await Organization.destroy({
            truncate: true,
            cascade: true,
        });
        await AuditPeriod.destroy({
            truncate: true,
            cascade: true,
        });
        clock.restore();
    });

    describe('GET /:year/:half', () => {
        it('should return budgets of the given year and half', async () => {
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

    describe('GET /report/total/:organization_id/:year/:half', () => {
        it('should return total income and expense of the given organization, year, and half', async () => {
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
                .get(`/budgets/report/total/${budget.id}/2023/spring`);
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
});

describe('income router', () => {
    var clock: sinon.SinonFakeTimers;
    var budget_id: number;

    before(async function () {
        await initDB();
    });

    beforeEach(async () => {
        const organization = await Organization.create({
            name: '학부총학생회',
        });

        const budget = await Budget.create({
            OrganizationId: organization.id,
            year: 2023,
            half: 'spring',
            manager: '김넙죽',
        });
        budget_id = budget.id;
    });

    afterEach(async () => {
        await Income.destroy({
            truncate: true,
            cascade: true,
        });
        await Budget.destroy({
            truncate: true,
            cascade: true,
        });
        await Organization.destroy({
            truncate: true,
            cascade: true,
        });
        await AuditPeriod.destroy({
            truncate: true,
            cascade: true,
        });
        clock.restore();
    });

    describe('POST /:budget_id', () => {
        it('should create income item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/income/${budget_id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(200);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/income/${budget_id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('PUT /:income_id', () => {
        it('should update income item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget_id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/income/${income.id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(200);

            const updatedIncome = await Income.findByPk(income.id);
            expect(updatedIncome?.amount).to.be.equal(300000);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget_id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/income/${income.id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('DELETE /:income_id', () => {
        it('should delete income item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget_id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/income/${income.id}`);
            expect(res).to.have.status(200);

            const deletedIncome = await Income.findByPk(income.id);
            expect(deletedIncome).to.be.null;
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget_id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/income/${income.id}`);
            expect(res).to.have.status(403);
        });
    });
});

describe('expense router', () => {
    var clock: sinon.SinonFakeTimers;
    var budget_id: number;

    before(async () => {
        await initDB();
    });

    beforeEach(async () => {
        const organization = await Organization.create({
            name: '학부총학생회',
        });

        const budget = await Budget.create({
            OrganizationId: organization.id,
            year: 2023,
            half: 'spring',
            manager: '김넙죽',
        });
        budget_id = budget.id;
    });

    afterEach(async () => {
        await Expense.destroy({
            truncate: true,
            cascade: true,
        });
        await Budget.destroy({
            truncate: true,
            cascade: true,
        });
        await Organization.destroy({
            truncate: true,
            cascade: true,
        });
        await AuditPeriod.destroy({
            truncate: true,
            cascade: true,
        });
        clock.restore();
    });

    describe('POST /:budget_id', () => {
        it('should create expense item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/expense/${budget_id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(200);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/expense/${budget_id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('PUT /:expense_id', () => {
        it('should update expense item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/expense/${expense.id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(200);

            const updatedExpense = await Expense.findByPk(expense.id);
            expect(updatedExpense?.amount).to.be.equal(300000);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/expense/${expense.id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('DELETE /:expense_id', () => {
        it('should delete expense item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/expense/${expense.id}`);
            expect(res).to.have.status(200);

            const deletedExpense = await Expense.findByPk(expense.id);
            expect(deletedExpense).to.be.null;
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/expense/${expense.id}`);
            expect(res).to.have.status(403);
        });
    });
});
