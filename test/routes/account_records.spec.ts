import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as auth from '../../src/middleware/auth';
import * as model from '../../src/model';
import { initDB } from '../../src/db/utils';
import { createApp } from '../../src/app';
import { readFileSync } from 'fs';
import * as s3Service from '../../src/service/s3';

chai.use(chaiHttp);

// for organization
const ORGANIZATION_NAME = '감사원';

// for account
const YEAR = 2023;
const HALF = 'spring';
const NAME = '김넙죽';
const ACCOUNT_NUMBER = '1234567890';
const ACCOUNT_BANK = '우리은행';
const ACCOUNT_OWNER = '넓넙죽';
const CARD_NUMBER = '1234567890';

// for account_record
const NOTE = '비고'; // 비고
const KEY = 'test.jpg';
const TEST_IMAGE_PATH = './test/assets/image1.jpg';
const TEST_IMAGE = readFileSync(TEST_IMAGE_PATH);
const FILENAME = 'test.jpg';

describe('API /account_records', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    let organization: model.Organization;
    let account: model.Account;

    var stubS3Upload: sinon.SinonStub;
    var stubS3Delete: sinon.SinonStub;

    before(async function () {
        this.timeout(10000);
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
            .callsFake(async (req, res, next) => {
                return next();
            });

        stubS3Upload = sinon
            .stub(s3Service, 'uploadFileToS3')
            .callsFake(async (filepath, key) => {
                return Promise.resolve({
                    uri: `${process.env.AWS_S3_BUCKET_NAME}/${key}`,
                    statusCode: 200,
                });
            });

        stubS3Delete = sinon
            .stub(s3Service, 'deleteFileFromS3')
            .callsFake(async (key) => {
                return Promise.resolve({
                    statusCode: 200,
                });
            });
        app = createApp();
    });

    after(function () {
        stubValidateOrganization.restore();
        stubS3Upload.restore();
        stubS3Delete.restore();
    });

    beforeEach(async function () {
        organization = await model.Organization.create({
            name: ORGANIZATION_NAME,
        });

        account = await model.Account.create({
            organizationId: organization.id,
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
    });

    describe('GET /:organization_id/:account_id', function () {
        it('피감기관 별로 통장 입출금 증빙 자료를 조회할 수 있다.', async function () {
            const accountRecord = await model.AccountRecord.create({
                accountId: account.id,
                note: NOTE,
                key: KEY,
            });

            const res = await chai
                .request(app)
                .get(`/account_records/${organization.id}/${account.id}`);

            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(1);
            expect(res.body[0].accountId).to.equal(account.id);
            expect(res.body[0].key).to.equal(KEY);
            expect(res.body[0].note).to.equal(NOTE);
        });
    });

    describe('POST /:organizationId/:account_id', function () {
        it('피감기관의 통장 입출금 내역 증빙 자료를 추가할 수 있다.', async function () {
            const res = await chai
                .request(app)
                .post(`/account_records/${organization.id}/${account.id}`)
                .set('Content-Type', 'multipart/form-data')
                .field('note', NOTE) // Add this line to send req.body.note
                .attach('file', TEST_IMAGE, FILENAME);

            expect(res).to.have.status(200);
            const accountRecords = await model.AccountRecord.findAll({
                where: {
                    accountId: account.id,
                },
            });

            const fileKey = `${organization.id}/${YEAR}/${HALF}/account_records/${account.id}`;
            expect(accountRecords.length).to.equal(1);
            expect(accountRecords[0].note).to.equal(NOTE);

            // FILENAME 앞 부분 folder까지가 일치해야 함.
            const fileKeyUptoFolder = accountRecords[0].key
                .split('/')
                .slice(0, -1)
                .join('/');
            expect(fileKeyUptoFolder).to.equal(fileKey);
        });
    });

    describe('DELETE /:organizationId/:accountRecordId', function () {
        it('피감기관의 통장 거래 내역 증빙 자료를 삭제할 수 있다.', async function () {
            const accountRecord = await model.AccountRecord.create({
                accountId: account.id,
                note: NOTE,
                key: KEY,
            });

            const res = await chai
                .request(app)
                .delete(
                    `/account_records/${organization.id}/${accountRecord.id}`,
                );
            expect(res).to.have.status(200);
            const accountRecords = await model.AccountRecord.findAll({
                where: {
                    id: accountRecord.id,
                },
            });

            expect(accountRecords.length).to.equal(0);
        });
    });
});
