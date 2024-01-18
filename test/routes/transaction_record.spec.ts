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

const ORGANIZATION_NAME = '감사원';
const YEAR = 2023;
const HALF = 'spring';
const MANAGER = '김넙죽';
const CODE = 'A1'; // 예산 코드
const SOURCE = '학생회비'; // 재원 (학생회비, 본회계, 자치)
const CATEGORY = '중앙회계'; // 예산 분류 (e.g. 중앙회계, 학교지원금)
const CONTENT = '교육비'; // 항목 (세부 항목)
const AMOUNT = 100000; // 금액
const NOTE = '비고'; // 비고
const PROJECT = '사업명'; // 사업명

const PROJECTAT = new Date();
const TYPE = '공금카드';
const BALANCE = 1000000;
const ACCOUNTNUMBER = '1234567890';
const ACCOUNTBANK = '우리은행';
const ACCOUNTOWNER = '넙넙죽';
const RECIEVINGACCOUNTBANK = '우리은행';
const RECIEVINGACCOUNTNUMBER = '1234567890';
const RECIEVINGACCOUNTOWNER = '최넙죽';

const KEY = 'test/test.jpg';
const TEST_IMAGE_PATH = './test/assets/image1.jpg';
const TEST_IMAGE = readFileSync(TEST_IMAGE_PATH);
const FILENAME = 'test.jpg';

describe('API /transaction_record', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    let organization: model.Organization;
    let budget: model.Budget;
    let income: model.Income;
    let expense: model.Expense;
    let transaction: model.Transaction;
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

        budget = await model.Budget.create({
            manager: MANAGER,
            year: YEAR,
            half: HALF,
            organizationId: organization.id,
        });

        expense = await model.Expense.create({
            code: CODE,
            source: SOURCE,
            category: CATEGORY,
            project: PROJECT,
            content: CONTENT,
            amount: AMOUNT,
            note: NOTE,
            BudgetId: budget.id,
        });

        transaction = await model.Transaction.create({
            projectAt: PROJECTAT,
            manager: MANAGER,
            content: CONTENT,
            type: TYPE,
            amount: AMOUNT,
            balance: BALANCE,
            transactionAt: PROJECTAT,
            accountNumber: ACCOUNTNUMBER,
            accountBank: ACCOUNTBANK,
            accountOwner: ACCOUNTOWNER,
            receivingAccountNumber: RECIEVINGACCOUNTNUMBER,
            receivingAccountBank: RECIEVINGACCOUNTBANK,
            receivingAccountOwner: RECIEVINGACCOUNTOWNER,
            ExpenseId: expense.id,
        });
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.Organization.destroy(options);
        await model.Budget.destroy(options);
        await model.Income.destroy(options);
        await model.Expense.destroy(options);
        await model.Transaction.destroy(options);
        await model.TransactionRecord.destroy(options);
    });

    describe('GET /:organization_id/:year/:half', function () {
        it('피감기관 별로 거래 내역 증빙 자료의 목록을 확인할 수 있다.', async function () {
            const transactionRecord = await model.TransactionRecord.create({
                transactionId: transaction.id,
                key: KEY,
                note: NOTE,
            });

            const res = await chai
                .request(app)
                .get(`/transaction_records/${organization.id}/${YEAR}/${HALF}`);

            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(1);
            expect(res.body[0].transactionId).to.equal(transaction.id);
            expect(res.body[0].key).to.equal(KEY);
            expect(res.body[0].note).to.equal(NOTE);
        });
    });

    describe('POST /:organizationId/:transactionId', function () {
        it('피감기관의 거래 내역 증빙 자료를 추가할 수 있다.', async function () {
            const res = await chai
                .request(app)
                .post(
                    `/transaction_records/${organization.id}/${transaction.id}`,
                )
                .set('Content-Type', 'multipart/form-data')
                .attach('file', TEST_IMAGE, FILENAME)
                .field('memo', NOTE);

            expect(res).to.have.status(200);

            const transactionRecords = await model.TransactionRecord.findAll({
                where: {
                    transactionId: transaction.id,
                },
            });
            const fileKey = `${organization.id}/${YEAR}/${HALF}/transaction_records/${transaction.id}`;
            expect(transactionRecords.length).to.equal(1);
            expect(transactionRecords[0].note).to.equal(NOTE);

            // FILENAME 앞 부분 folder까지가 일치해야 함.
            const fileKeyUptoFolder = transactionRecords[0].key
                .split('/')
                .slice(0, -1)
                .join('/');
            expect(fileKeyUptoFolder).to.equal(fileKey);
        });
    });

    describe('DELETE /:organizationId/:transaction_record_id', function () {
        it('피감기관의 거래 내역 증빙 자료를 삭제할 수 있다.', async function () {
            const transactionRecord = await model.TransactionRecord.create({
                transactionId: transaction.id,
                key: KEY,
                note: NOTE,
            });

            const res = await chai
                .request(app)
                .delete(
                    `/transaction_records/${organization.id}/${transactionRecord.id}`,
                );
            expect(res).to.have.status(200);
            const transactionRecords = await model.TransactionRecord.findAll({
                where: {
                    id: transactionRecord.id,
                },
            });
            expect(transactionRecords.length).to.equal(0);
        });
    });
});
