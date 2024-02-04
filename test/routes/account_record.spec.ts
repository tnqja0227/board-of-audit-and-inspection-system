import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as auth from '../../src/middleware/auth';
import { initDB } from '../../src/db/utils';
import * as model from '../../src/model';
import { createApp } from '../../src/app';
import { readFileSync } from 'fs';
import * as s3Service from '../../src/config/s3';
import * as validate_audit_period from '../../src/middleware/validate_audit_period';

chai.use(chaiHttp);

// for organization
const ORGANIZATION_NAME = '감사원';

// for account
const YEAR = '2023';
const HALF = 'spring';
const NAME = '김넙죽';
const ACCOUNT_NUMBER = '1234567890';
const ACCOUNT_BANK = '우리은행';
const ACCOUNT_OWNER = '넓넙죽';
const CARD_NUMBER = '1234567890';

// for account_record
const KEY = 'test.jpg';
const TEST_IMAGE_PATH = './test/assets/image1.jpg';
const TEST_IMAGE = readFileSync(TEST_IMAGE_PATH);
const FILENAME = 'test.jpg';

describe('API /account_records', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    var stubValidateAuditPeriod: sinon.SinonStub;
    let organization: model.Organization;
    let account: model.Account;

    var stubS3Upload: sinon.SinonStub;
    var stubS3Delete: sinon.SinonStub;

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

        stubS3Upload = sinon
            .stub(s3Service, 'uploadFileToS3')
            .callsFake(async (file, key) => {
                return Promise.resolve({
                    statusCode: 200,
                });
            });

        stubS3Delete = sinon
            .stub(s3Service, 'deleteFileFromS3')
            .callsFake(async (key) => {
                return Promise.resolve({
                    statusCode: 204,
                });
            });
        app = createApp();
    });

    after(function () {
        stubValidateOrganization.restore();
        stubValidateAuditPeriod.restore();
        stubS3Upload.restore();
        stubS3Delete.restore();
    });

    beforeEach(async function () {
        organization = await model.Organization.create({
            name: ORGANIZATION_NAME,
        });

        account = await model.Account.create({
            OrganizationId: organization.id,
            year: YEAR,
            half: HALF,
            name: NAME,
            accountNumber: ACCOUNT_NUMBER,
            accountBank: ACCOUNT_BANK,
            accountOwner: ACCOUNT_OWNER,
            cardNumber: CARD_NUMBER,
        });
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.Organization.destroy(options);
        await model.Account.destroy(options);
        await model.AccountRecord.destroy(options);
    });

    describe('GET /:account_id', function () {
        it('특정 계좌의 통장 입출금 증빙 자료를 조회할 수 있다.', async function () {
            await model.AccountRecord.create({
                URI: KEY,
                AccountId: account.id,
            });

            const res = await chai
                .request(app)
                .get(`/account_records/${account.id}`);

            expect(res).to.have.status(200);
            expect(res.body.URI).to.equal(s3Service.s3keyToUri(KEY));
        });
    });

    describe('POST /:account_id', function () {
        it('피감기관의 통장 입출금 내역 증빙 자료를 추가할 수 있다.', async function () {
            const res = await chai
                .request(app)
                .post(`/account_records/${account.id}`)
                .set('Content-Type', 'multipart/form-data')
                .attach('file', TEST_IMAGE, FILENAME);

            expect(res).to.have.status(200);

            const accountRecord = await model.AccountRecord.findOne({
                where: {
                    AccountId: account.id,
                },
            });
            const key = `${organization.name}/${account.year}/${
                account.half
            }/account_records/${account.name || account.id}`;
            expect(accountRecord!.URI).to.equal(key);
        });
    });

    describe('DELETE /:account_record_id', function () {
        it('피감기관의 통장 거래 내역 증빙 자료를 삭제할 수 있다.', async function () {
            const accountRecord = await model.AccountRecord.create({
                URI: KEY,
                AccountId: account.id,
            });

            const res = await chai
                .request(app)
                .delete(`/account_records/${accountRecord.id}`);
            expect(res).to.have.status(200);

            const foundAccountRecord = await model.AccountRecord.findOne({
                where: {
                    AccountId: account.id,
                },
            });
            expect(foundAccountRecord).to.be.null;
        });
    });
});
