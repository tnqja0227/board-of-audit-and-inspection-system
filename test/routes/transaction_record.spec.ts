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

describe('API /transaction_record', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    let organization: model.Organization;
    let budget: model.Budget;
    let income: model.Income;
    let expense: model.Expense;
    let transaction: model.Transaction;

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
            // transaction record 하나 생성
            // transaction record 목록 조회 API 호출
            // response status code 200
            // 반환된 transaction record 목록이 생성한 transaction record 목록과 일치함
        });
    });

    describe('POST /:organization/:year/:half/:transaction_id', function () {
        it('피감기관의 거래 내역 증빙 자료를 추가할 수 있다.', async function () {
            // transaction record 하나 생성
            // transaction record 하나 생성 API 호출
            // response status code 200
            // 반환된 transaction record가 생성한 transaction record와 일치함
        });
    });

    describe('DELETE /:organization/:year/:half/:transaction_id/:transaction_record_id', function () {
        it('피감기관의 거래 내역 증빙 자료를 삭제할 수 있다.', async function () {
            // transaction record 하나 생성
            // transaction record 하나 삭제 API 호출
            // response status code 200
            // 아무 것도 반환 안 됨.
        });
    });
});
