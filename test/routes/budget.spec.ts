import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../src/db/utils';
import * as auth from '../../src/middleware/auth';
import * as validate_audit_period from '../../src/middleware/validate_audit_period';
import * as model from '../../src/model';
import { createApp } from '../../src/app';
import {
    expectedExpenseBudget,
    expectedIncomeBudget,
    expectedTotal,
} from '../mock/budget';

chai.use(chaiHttp);

describe('API /budgets', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    var stubValidateIsAdmin: sinon.SinonStub;
    var stubValidateAuditPeriod: sinon.SinonStub;
    var organization: model.Organization;

    before(async function () {
        this.timeout(10000);
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
            .callsFake(async (req, res, next) => {
                return next();
            });
        stubValidateIsAdmin = sinon
            .stub(auth, 'validateIsAdmin')
            .callsFake(async (req, res, next) => {
                return next();
            });
        stubValidateAuditPeriod = sinon
            .stub(validate_audit_period, 'validateAuditPeriod')
            .callsFake(async (req, res, next) => {
                return next();
            });

        app = createApp();
    });

    beforeEach(async function () {
        organization = await model.Organization.create({
            name: '학부총학생회',
        });
    });

    after(function () {
        stubValidateOrganization.restore();
        stubValidateIsAdmin.restore();
        stubValidateAuditPeriod.restore();
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.User.destroy(options);
        await model.Budget.destroy(options);
        await model.Organization.destroy(options);
        await model.AuditPeriod.destroy(options);
        await model.Income.destroy(options);
        await model.Expense.destroy(options);
        await model.Transaction.destroy(options);
    });

    describe('GET /income/:organization_id/:year/:half', function () {
        it('해당 연도 및 분기의 피감기구 수입 예산안을 조회할 수 있다', async function () {
            const budget = await model.Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });
            await createDummyBudget(budget.id);

            const res = await chai
                .request(app)
                .get(`/budgets/income/${organization.id}/2023/spring`);
            expect(res.status).eql(200);
            expect(res.body).eql(expectedIncomeBudget(budget.id));
        });
    });

    describe('GET /expense/:organization_id/:year/:half', function () {
        it('해당 연도 및 분기의 피감기구 지출 예산안을 조회할 수 있다', async function () {
            const budget = await model.Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });
            await createDummyBudget(budget.id);

            const res = await chai
                .request(app)
                .get(`/budgets/expense/${organization.id}/2023/spring`);
            expect(res.status).eql(200);
            expect(res.body).eql(expectedExpenseBudget(budget.id));
        });
    });

    describe('GET /total/:organization_id/:year/:half', function () {
        it('예결산안에 대한 총계를 확인할 수 있다', async function () {
            const budget = await model.Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });
            await createDummyBudget(budget.id);

            const res = await chai
                .request(app)
                .get(`/budgets/total/${organization.id}/2023/spring`);
            expect(res.status).eql(200);
            expect(res.body).eql(expectedTotal(budget.id));
        });
    });

    describe('POST /:organization_id/:year/:half', function () {
        it('예산안을 생성할 수 있다', async function () {
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
    });

    describe('DELETE /:organization_id/:year/:half', function () {
        it('예산안을 삭제할 수 있다', async function () {
            const budget = await model.Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/${organization.id}/2023/spring`);

            expect(res.status).eql(200);
            expect(await model.Budget.findByPk(budget.id)).eql(null);
        });
    });
});

async function createDummyBudget(budget_id: string | number) {
    const createIncomeTransaction = (
        content: string,
        amount: number,
        income_id: string | number,
    ) => {
        return model.Transaction.create({
            projectAt: new Date('2023-04-01'),
            manager: '김넙죽',
            content: content,
            amount: amount,
            balance: 0,
            transactionAt: new Date('2023-04-01'),
            accountNumber: '1234567890',
            accountBank: '우리은행',
            accountOwner: '김넙죽',
            IncomeId: income_id,
        });
    };
    const createExpenseTransaction = (
        content: string,
        amount: number,
        expense_id: string | number,
    ) => {
        return model.Transaction.create({
            projectAt: new Date('2023-04-01'),
            manager: '김넙죽',
            content: content,
            amount: amount,
            balance: 0,
            transactionAt: new Date('2023-04-01'),
            accountNumber: '1234567890',
            accountBank: '우리은행',
            accountOwner: '김넙죽',
            ExpenseId: expense_id,
        });
    };

    const income101 = await model.Income.create({
        BudgetId: budget_id,
        code: '101',
        source: '학생회비',
        category: '중앙회계',
        content: '중앙회계 지원금',
        amount: 180000,
    });
    await createIncomeTransaction('중앙회계 지원금', 180000, income101.id);

    const income102 = await model.Income.create({
        BudgetId: budget_id,
        code: '102',
        source: '학생회비',
        category: '중앙회계',
        content: '중앙회계 이월금',
        amount: 632238,
    });
    await createIncomeTransaction('중앙회계 이월금', 502690, income102.id);

    const income103 = await model.Income.create({
        BudgetId: budget_id,
        code: '103',
        source: '학생회비',
        category: '격려기금',
        content: '격려금',
        amount: 1543856,
    });
    await createIncomeTransaction('격려금', 186441, income103.id);

    const income301 = await model.Income.create({
        BudgetId: budget_id,
        code: '301',
        source: '자치',
        category: '예금이자',
        content: '예금이자',
        amount: 2000,
    });
    await createIncomeTransaction('예금이자', 261, income301.id);

    const expense401 = await model.Expense.create({
        BudgetId: budget_id,
        code: '401',
        source: '학생회비',
        category: '운영비',
        project: '격려기금',
        content: '격려금',
        amount: 1543856,
    });
    await createExpenseTransaction('격려금', 186441, expense401.id);

    const expense402 = await model.Expense.create({
        BudgetId: budget_id,
        code: '402',
        source: '학생회비',
        category: '정기사업비',
        project: '감사원 LT',
        content: '복리후생비',
        amount: 120000,
    });

    const expense403 = await model.Expense.create({
        BudgetId: budget_id,
        code: '403',
        source: '학생회비',
        category: '회의비',
        project: '감사원 회의',
        content: '회의비',
        amount: 120000,
        note: '내부 문제로 LT 사업 진행하지 않아 미집행',
    });

    const expense404 = await model.Expense.create({
        BudgetId: budget_id,
        code: '404',
        source: '학생회비',
        category: '비정기사업비',
        project: '사무소모품 및 유지',
        content: '복리후생비',
        amount: 60000,
    });
    await createExpenseTransaction('복리후생비', 61370, expense404.id);
}
