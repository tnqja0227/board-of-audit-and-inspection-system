import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../../src/db/util';
import * as auth from '../../../src/middleware/auth';
import * as validate_audit_period from '../../../src/middleware/validate_audit_period';
import * as model from '../../../src/model';
import * as budgetMiddleware from '../../../src/middleware/budget';

chai.use(chaiHttp);

const dummyIncome = {
    code: '101',
    source: '학생회비',
    category: '중앙회계',
    content: '중앙회계 지원금',
    amount: 180000,
    note: '',
};

describe('API /budgets/income', function () {
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

        app = await require('../../../src/app').default;
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
        await model.Income.destroy(options);
        await model.Budget.destroy(options);
        await model.Organization.destroy(options);
    });

    describe('POST /:budget_id', function () {
        it('예산(수입)을 생성할 수 있다', async function () {
            const res = await chai
                .request(app)
                .post(`/budgets/income/${budget.id}`)
                .send(dummyIncome);
            expect(res).to.have.status(200);
            expect(res.body.code).to.equal('101');
            expect(res.body.source).to.equal('학생회비');
            expect(res.body.category).to.equal('중앙회계');
            expect(res.body.content).to.equal('중앙회계 지원금');
            expect(res.body.amount).to.equal(180000);
        });
    });

    describe('PUT /:income_id', function () {
        it('예산(수입)을 변경할 수 있다', async function () {
            const income = await model.Income.create(dummyIncome);
            const res = await chai
                .request(app)
                .put(`/budgets/income/${income.id}`)
                .send({
                    amount: 300000,
                });
            expect(res).to.have.status(200);

            const updatedIncome = await model.Income.findByPk(income.id);
            expect(updatedIncome?.amount).to.be.equal(300000);
        });
    });

    describe('DELETE /:income_id', () => {
        it('예산(수입)을 삭제할 수 있다', async () => {
            const income = await model.Income.create(dummyIncome);
            const res = await chai
                .request(app)
                .delete(`/budgets/income/${income.id}`);
            expect(res).to.have.status(200);

            const deletedIncome = await model.Income.findByPk(income.id);
            expect(deletedIncome).to.be.null;
        });
    });
});
