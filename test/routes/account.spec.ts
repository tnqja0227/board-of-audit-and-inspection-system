import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as auth from '../../src/middleware/auth';
import * as model from '../../src/model';
import { initDB } from '../../src/db/utils';
import { createApp } from '../../src/app';

chai.use(chaiHttp);

const ORGANIZATION_NAME = '감사원';
const YEAR = 2023;
const HALF = 'spring';

describe('API /accounts', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    let organization: model.Organization;

    before(async function () {
        this.timeout(10000);
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
            .callsFake(async (req, res, next) => {
                return next();
            });
        app = createApp();
    });

    after(function () {
        stubValidateOrganization.restore();
    });

    beforeEach(async function () {
        organization = await model.Organization.create({
            name: ORGANIZATION_NAME,
        });
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.Organization.destroy(options);
        await model.Account.destroy(options);
    });

    describe('GET /:organization_id/:year/:half', function () {
        it('피감기관 별로 계좌 목록을 확인할 수 있다.', async function () {
            const accountNumber = '1234567890';
            const accountBank = '우리은행';
            const accountOwner = '김넙죽';
            const cardNumber = '1234567890123456';

            await model.Account.create({
                year: YEAR,
                half: HALF,
                accountNumber: accountNumber,
                accountBank: accountBank,
                accountOwner: accountOwner,
                cardNumber: cardNumber,
                OrganizationId: organization.id,
            });

            const res = await chai
                .request(app)
                .get(`/accounts/${organization.id}/${YEAR}/${HALF}`);
            expect(res).to.have.status(200);
            expect(res.body[0].accountNumber).to.equal(accountNumber);
            expect(res.body[0].accountBank).to.equal(accountBank);
            expect(res.body[0].accountOwner).to.equal(accountOwner);
            expect(res.body[0].cardNumber).to.equal(cardNumber);
        });
    });

    describe('POST /:organizationid/:year/:half', function () {
        it('피감기관의 계좌를 추가할 수 있다.', async function () {
            const accountName = '주계좌';
            const accountNumber = '1234567890';
            const accountBank = '우리은행';
            const accountOwner = '김넙죽';
            const cardNumber = '1234567890123456';

            const res = await chai
                .request(app)
                .post(`/accounts/${organization.id}/${YEAR}/${HALF}`)
                .send({
                    name: accountName,
                    accountNumber: accountNumber,
                    accountBank: accountBank,
                    accountOwner: accountOwner,
                    cardNumber: cardNumber,
                });
            expect(res).to.have.status(200);

            const accounts = await model.Account.findAll({
                where: {
                    OrganizationId: organization.id,
                    year: YEAR,
                    half: HALF,
                },
                order: [['accountNumber', 'ASC']],
            });
            expect(accounts[0].name).to.equal(accountName);
            expect(accounts[0].accountNumber).to.equal(accountNumber);
            expect(accounts[0].accountBank).to.equal(accountBank);
            expect(accounts[0].accountOwner).to.equal(accountOwner);
            expect(accounts[0].cardNumber).to.equal(cardNumber);
        });
    });

    describe('PUT /:account_id', function () {
        it('계좌 정보를 수정할 수 있다.', async function () {
            const accountName = '주계좌';
            const accountNumber = '1234567890';
            const accountBank = '우리은행';
            const accountOwner = '김넙죽';
            const cardNumber = '1234567890123456';

            const account = await model.Account.create({
                year: YEAR,
                half: HALF,
                accountNumber: accountNumber,
                accountBank: accountBank,
                accountOwner: accountOwner,
                cardNumber: cardNumber,
                OrganizationId: organization.id,
            });

            const newAccountName = '변경된 계좌';
            const newAccountNumber = '0987654321';
            const newAccountBank = '국민은행';
            const newAccountOwner = '김죽넙';
            const newCardNumber = '6543210987654321';

            const res = await chai
                .request(app)
                .put(`/accounts/${account.id}`)
                .send({
                    name: newAccountName,
                    accountNumber: newAccountNumber,
                    accountBank: newAccountBank,
                    accountOwner: newAccountOwner,
                    cardNumber: newCardNumber,
                });
            expect(res).to.have.status(200);

            const accounts = await model.Account.findAll({
                where: {
                    OrganizationId: organization.id,
                    year: YEAR,
                    half: HALF,
                },
                order: [['accountNumber', 'ASC']],
            });
            expect(accounts[0].name).to.equal(newAccountName);
            expect(accounts[0].accountNumber).to.equal(newAccountNumber);
            expect(accounts[0].accountBank).to.equal(newAccountBank);
            expect(accounts[0].accountOwner).to.equal(newAccountOwner);
            expect(accounts[0].cardNumber).to.equal(newCardNumber);
        });
    });

    describe('DELETE /:account_id', function () {
        it('계좌 정보를 삭제할 수 있다.', async function () {
            const accountNumber = '1234567890';
            const accountBank = '우리은행';
            const accountOwner = '김넙죽';
            const cardNumber = '1234567890123456';

            const account = await model.Account.create({
                year: YEAR,
                half: HALF,
                accountNumber: accountNumber,
                accountBank: accountBank,
                accountOwner: accountOwner,
                cardNumber: cardNumber,
                OrganizationId: organization.id,
            });

            const res = await chai
                .request(app)
                .delete(`/accounts/${account.id}`);
            expect(res).to.have.status(200);

            const accounts = await model.Account.findAll({
                where: {
                    OrganizationId: organization.id,
                    year: YEAR,
                    half: HALF,
                },
                order: [['accountNumber', 'ASC']],
            });
            expect(accounts.length).to.equal(0);
        });
    });
});
