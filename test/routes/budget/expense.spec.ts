import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../../src/db/utils';
import * as auth from '../../../src/middleware/auth';
import * as validate_audit_period from '../../../src/middleware/validate_audit_period';
import * as model from '../../../src/model';
import * as budgetMiddleware from '../../../src/middleware/budget';
import { createApp } from '../../../src/app';

chai.use(chaiHttp);

const dummyExpense = {
    code: '401',
    source: '학생회비',
    category: '운영비',
    project: '격려기금',
    content: '격려금',
    amount: 1543856,
    note: '',
};

describe('API /budgets/expense', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    var stubValidateIsAdmin: sinon.SinonStub;
    var stubValidateAuditPeriod: sinon.SinonStub;
    var stubValidateCode: sinon.SinonStub;
    var budget: model.Budget;

    before(async function () {
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
        stubValidateCode = sinon
            .stub(budgetMiddleware, 'validateCode')
            .callsFake((req, res, next) => {
                return next();
            });

        app = createApp();
    });

    beforeEach(async function () {
        const organization = await model.Organization.create({
            name: '학부총학생회',
        });

        budget = await model.Budget.create({
            OrganizationId: organization.id,
            manager: '김넙죽',
            year: 2023,
            half: 'spring',
        });
    });

    after(function () {
        stubValidateOrganization.restore();
        stubValidateIsAdmin.restore();
        stubValidateAuditPeriod.restore();
        stubValidateCode.restore();
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.Expense.destroy(options);
        await model.Budget.destroy(options);
        await model.Organization.destroy(options);
    });

    describe('GET /list/:organization_id/:year/:half', function () {
        it('예산(지출) 목록을 조회할 수 있다', async function () {
            const expense401 = await model.Expense.create({
                BudgetId: budget.id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려기금',
                content: '격려금',
                amount: 1543856,
            });

            const expense402 = await model.Expense.create({
                BudgetId: budget.id,
                code: '402',
                source: '학생회비',
                category: '정기사업비',
                project: '감사원 LT',
                content: '복리후생비',
                amount: 120000,
            });

            const expense403 = await model.Expense.create({
                BudgetId: budget.id,
                code: '403',
                source: '학생회비',
                category: '회의비',
                project: '감사원 회의',
                content: '회의비',
                amount: 120000,
                note: '내부 문제로 LT 사업 진행하지 않아 미집행',
            });

            const expense404 = await model.Expense.create({
                BudgetId: budget.id,
                code: '404',
                source: '학생회비',
                category: '비정기사업비',
                project: '사무소모품 및 유지',
                content: '복리후생비',
                amount: 60000,
            });

            const res = await chai
                .request(app)
                .get(
                    `/budgets/expense/list/${budget.OrganizationId}/${budget.year}/${budget.half}`,
                );
            expect(res).to.have.status(200);
            expect(res.body[0].id).to.equal(expense401.id);
            expect(res.body[0].code).to.equal(expense401.code);
            expect(res.body[1].id).to.equal(expense402.id);
            expect(res.body[1].code).to.equal(expense402.code);
            expect(res.body[2].id).to.equal(expense403.id);
            expect(res.body[2].code).to.equal(expense403.code);
            expect(res.body[3].id).to.equal(expense404.id);
            expect(res.body[3].code).to.equal(expense404.code);
        });
    });

    describe('POST /:budget_id', function () {
        it('예산(지출)을 생성할 수 있다', async function () {
            const res = await chai
                .request(app)
                .post(`/budgets/expense/${budget.id}`)
                .send(dummyExpense);
            expect(res).to.have.status(200);
            expect(res.body.code).to.equal('401');
            expect(res.body.source).to.equal('학생회비');
            expect(res.body.category).to.equal('운영비');
            expect(res.body.project).to.equal('격려기금');
            expect(res.body.content).to.equal('격려금');
            expect(res.body.amount).to.equal(1543856);
        });
    });

    describe('PUT /:expense_id', function () {
        it('예산(지출)을 변경할 수 있다', async function () {
            const expense = await model.Expense.create(dummyExpense);

            const res = await chai
                .request(app)
                .put(`/budgets/expense/${expense.id}`)
                .send({
                    amount: 300000,
                });
            expect(res).to.have.status(200);

            const updatedExpense = await model.Expense.findByPk(expense.id);
            expect(updatedExpense?.amount).to.be.equal(300000);
        });
    });

    describe('DELETE /:expense_id', function () {
        it('예산(지출)을 삭제할 수 있다', async function () {
            const expense = await model.Expense.create(dummyExpense);

            const res = await chai
                .request(app)
                .delete(`/budgets/expense/${expense.id}`);
            expect(res).to.have.status(200);

            const deletedExpense = await model.Expense.findByPk(expense.id);
            expect(deletedExpense).to.be.null;
        });
    });
});
