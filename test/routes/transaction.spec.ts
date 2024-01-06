import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../src/db/utils';
import * as auth from '../../src/middleware/auth';
import * as validate_audit_period from '../../src/middleware/validate_audit_period';
import * as model from '../../src/model';
import { sequelize } from '../../src/db';
import { createApp } from '../../src/app';
import * as mock from '../mock';

chai.use(chaiHttp);

describe('API /transactions', () => {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    var stubValidateAuditPeriod: sinon.SinonStub;

    before(async function () {
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
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

    after(function () {
        stubValidateOrganization.restore();
        stubValidateAuditPeriod.restore();
    });

    describe('GET /:organization_id/:year/:half', () => {
        let organizationId: number | string;

        beforeEach(async () => {
            const res = await chai.request(app).post('/test/dummy');
            organizationId = res.body.organizationId;
        });

        afterEach(async () => {
            await sequelize.truncate({ cascade: true });
        });

        it('통장거래내역 목록을 확인할 수 있다.', async () => {
            const res = await chai
                .request(app)
                .get(`/transactions/${organizationId}/2023/spring`);

            expect(res.body[0].accountNumber).to.equal('1234567890');
            expect(res.body[0].contents[0].code).to.equal('404');
            expect(res.body[0].contents[0].amount).to.equal(-61370);
            expect(res.body[0].contents[0].balance).to.equal(621320);
            expect(res.body[0].contents[1].code).to.equal('401');
            expect(res.body[0].contents[1].amount).to.equal(-186441);
            expect(res.body[0].contents[1].balance).to.equal(682690);
            expect(res.body[0].contents[2].code).to.equal('103');
            expect(res.body[0].contents[2].amount).to.equal(186441);
            expect(res.body[0].contents[2].balance).to.equal(869131);
            expect(res.body[0].contents[3].code).to.equal('102');
            expect(res.body[0].contents[3].amount).to.equal(502690);
            expect(res.body[0].contents[3].balance).to.equal(682690);
            expect(res.body[0].contents[4].code).to.equal('101');
            expect(res.body[0].contents[4].amount).to.equal(180000);
            expect(res.body[0].contents[4].balance).to.equal(180000);
            expect(res.body[1].accountNumber).to.equal('9876543210');
            expect(res.body[1].contents[0].code).to.equal('301');
            expect(res.body[1].contents[0].amount).to.equal(261);
            expect(res.body[1].contents[0].balance).to.equal(261);
        });
    });

    describe('POST /', () => {
        let organizationId: number | string;
        let incomeId: number | string;

        beforeEach(async () => {
            const res = await chai.request(app).post('/test/dummy');
            organizationId = res.body.organizationId;
            incomeId = res.body.income103Id;
        });

        afterEach(async () => {
            await sequelize.truncate({ cascade: true });
        });

        it('통장거래내역을 새로 추가할 경우 해당 거래내역의 balance와 이후 거래내역의 balance가 적절하게 업데이트되어야 한다.', async () => {
            let res = await chai
                .request(app)
                .post(`/transactions`)
                .send(mock.createMockIncomeTransaction1(incomeId));
            expect(res).to.have.status(200);
            expect(res.body.content).to.equal('테스트');
            expect(res.body.amount).to.equal(50000);
            expect(res.body.balance).to.equal(919131);

            res = await chai
                .request(app)
                .get(`/transactions/${organizationId}/2023/spring`);
            expect(res.body[0].accountNumber).to.equal('1234567890');
            expect(res.body[0].contents[0].code).to.equal('404');
            expect(res.body[0].contents[0].amount).to.equal(-61370);
            expect(res.body[0].contents[0].balance).to.equal(671320);
            expect(res.body[0].contents[1].code).to.equal('401');
            expect(res.body[0].contents[1].amount).to.equal(-186441);
            expect(res.body[0].contents[1].balance).to.equal(732690);
            expect(res.body[0].contents[2].code).to.equal('103');
            expect(res.body[0].contents[2].amount).to.equal(50000);
            expect(res.body[0].contents[2].balance).to.equal(919131);
            expect(res.body[0].contents[3].code).to.equal('103');
            expect(res.body[0].contents[3].amount).to.equal(186441);
            expect(res.body[0].contents[3].balance).to.equal(869131);
            expect(res.body[0].contents[4].code).to.equal('102');
            expect(res.body[0].contents[4].amount).to.equal(502690);
            expect(res.body[0].contents[4].balance).to.equal(682690);
            expect(res.body[0].contents[5].code).to.equal('101');
            expect(res.body[0].contents[5].amount).to.equal(180000);
            expect(res.body[0].contents[5].balance).to.equal(180000);
            expect(res.body[1].accountNumber).to.equal('9876543210');
            expect(res.body[1].contents[0].code).to.equal('301');
            expect(res.body[1].contents[0].amount).to.equal(261);
            expect(res.body[1].contents[0].balance).to.equal(261);
        });
    });

    describe('DELETE /:transaction_id', () => {
        let organization: model.Organization;
        let budget: model.Budget;
        let income: model.Income;
        let transaction: model.Transaction;

        beforeEach(async () => {
            organization = await model.Organization.create({
                name: '학부총학생회',
            });

            budget = await model.Budget.create({
                year: 2021,
                half: 'spring',
                manager: '김넙죽',
                OrganizationId: organization.id,
            });

            income = await model.Income.create({
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '예산',
                amount: 10000,
                BudgetId: budget.id,
            });

            transaction = await model.Transaction.create({
                projectAt: new Date('2021-01-01:00:00:00'),
                manager: '김넙죽',
                content: '테스트',
                type: '공금카드',
                amount: 10000,
                balance: 10000,
                transactionAt: new Date('2021-01-01:00:00:00'),
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
                IncomeId: income.id,
            });
        });

        afterEach(async () => {
            await sequelize.truncate({ cascade: true });
        });

        it('통장거래내역을 삭제할 수 있다', async () => {
            const res = await chai
                .request(app)
                .delete(`/transactions/${transaction.id}`);
            expect(res).to.have.status(200);

            const deletedTransaction = await model.Transaction.findByPk(
                transaction.id,
            );
            expect(deletedTransaction).to.be.null;
        });
    });

    describe('PUT /:transaction_id', () => {
        let organizationId: number | string;
        let incomeId: number | string;
        let expenseId: number | string;

        beforeEach(async () => {
            const res = await chai.request(app).post('/test/dummy');
            organizationId = res.body.organizationId;
            incomeId = res.body.income103Id;
            expenseId = res.body.expense402Id;
        });

        afterEach(async () => {
            await sequelize.truncate({ cascade: true });
        });

        it('통장거래내역을 업데이트 할 수 있다', async () => {
            let res = await chai
                .request(app)
                .post(`/transactions`)
                .send(mock.createMockIncomeTransaction1(incomeId));
            const transactionId = res.body.id;

            res = await chai
                .request(app)
                .put(`/transactions/${transactionId}`)
                .send({
                    content: '환불금',
                });
            expect(res).to.have.status(200);

            const updatedTransaction =
                await model.Transaction.findByPk(transactionId);
            expect(updatedTransaction?.content).to.equal('환불금');
        });

        it('통장거래내역의 project_at 혹은 amount를 업데이트 할 경우 해당 거래내역의 balance와 이후 거래내역의 balance가 적절하게 업데이트되어야 한다.', async () => {
            let res = await chai
                .request(app)
                .post(`/transactions`)
                .send(mock.createMockIncomeTransaction1(incomeId));
            const transactionId = res.body.id;

            res = await chai
                .request(app)
                .put(`/transactions/${transactionId}`)
                .send({
                    transaction_at: new Date('2023-03-01: 12:00:00'),
                    amount: 70000,
                });
            expect(res).to.have.status(200);

            res = await chai
                .request(app)
                .get(`/transactions/${organizationId}/2023/spring`);
            expect(res.body[0].accountNumber).to.equal('1234567890');
            expect(res.body[0].contents[0].code).to.equal('404');
            expect(res.body[0].contents[0].amount).to.equal(-61370);
            expect(res.body[0].contents[0].balance).to.equal(691320);
            expect(res.body[0].contents[1].code).to.equal('401');
            expect(res.body[0].contents[1].amount).to.equal(-186441);
            expect(res.body[0].contents[1].balance).to.equal(752690);
            expect(res.body[0].contents[2].code).to.equal('103');
            expect(res.body[0].contents[2].amount).to.equal(186441);
            expect(res.body[0].contents[2].balance).to.equal(939131);
            expect(res.body[0].contents[3].code).to.equal('102');
            expect(res.body[0].contents[3].amount).to.equal(502690);
            expect(res.body[0].contents[3].balance).to.equal(752690);
            expect(res.body[0].contents[4].code).to.equal('103');
            expect(res.body[0].contents[4].amount).to.equal(70000);
            expect(res.body[0].contents[4].balance).to.equal(250000);
            expect(res.body[0].contents[5].code).to.equal('101');
            expect(res.body[0].contents[5].amount).to.equal(180000);
            expect(res.body[0].contents[5].balance).to.equal(180000);

            expect(res.body[1].accountNumber).to.equal('9876543210');
            expect(res.body[1].contents[0].code).to.equal('301');
            expect(res.body[1].contents[0].amount).to.equal(261);
            expect(res.body[1].contents[0].balance).to.equal(261);
        });

        it('통장거래내역의 수입이 지출로 변경되거나 지출이 수입으로 변경될 경우 해당 거래내역의 balance와 이후 거래내역의 balance가 적절하게 업데이트되어야 한다.', async () => {
            let res = await chai
                .request(app)
                .post(`/transactions`)
                .send(mock.createMockIncomeTransaction1(incomeId));
            const transactionId = res.body.id;

            res = await chai
                .request(app)
                .put(`/transactions/${transactionId}`)
                .send({
                    expense_id: expenseId,
                });
            expect(res).to.have.status(200);

            res = await chai
                .request(app)
                .get(`/transactions/${organizationId}/2023/spring`);
            expect(res.body[0].accountNumber).to.equal('1234567890');
            expect(res.body[0].contents[0].code).to.equal('404');
            expect(res.body[0].contents[0].amount).to.equal(-61370);
            expect(res.body[0].contents[0].balance).to.equal(571320);
            expect(res.body[0].contents[1].code).to.equal('401');
            expect(res.body[0].contents[1].amount).to.equal(-186441);
            expect(res.body[0].contents[1].balance).to.equal(632690);
            expect(res.body[0].contents[2].code).to.equal('402');
            expect(res.body[0].contents[2].amount).to.equal(-50000);
            expect(res.body[0].contents[2].balance).to.equal(819131);
            expect(res.body[0].contents[3].code).to.equal('103');
            expect(res.body[0].contents[3].amount).to.equal(186441);
            expect(res.body[0].contents[3].balance).to.equal(869131);
            expect(res.body[0].contents[4].code).to.equal('102');
            expect(res.body[0].contents[4].amount).to.equal(502690);
            expect(res.body[0].contents[4].balance).to.equal(682690);
            expect(res.body[0].contents[5].code).to.equal('101');
            expect(res.body[0].contents[5].amount).to.equal(180000);
            expect(res.body[0].contents[5].balance).to.equal(180000);
            expect(res.body[1].accountNumber).to.equal('9876543210');
            expect(res.body[1].contents[0].code).to.equal('301');
            expect(res.body[1].contents[0].amount).to.equal(261);
            expect(res.body[1].contents[0].balance).to.equal(261);
        });
    });
});
