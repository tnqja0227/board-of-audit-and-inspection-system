import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../src/db/util';
import * as auth from '../../src/middleware/auth';
import * as validate_audit_period from '../../src/middleware/validate_audit_period';
import * as model from '../../src/model';

chai.use(chaiHttp);

describe('API /budgets', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    var stubValidateIsAdmin: sinon.SinonStub;
    var stubValidateAuditPeriodByYearAndHalf: sinon.SinonStub;
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
        stubValidateAuditPeriodByYearAndHalf = sinon
            .stub(validate_audit_period, 'validateAuditPeriodByYearAndHalf')
            .callsFake(async (req, res, next) => {
                return next();
            });

        app = require('../../src/app').default;
    });

    beforeEach(async function () {
        organization = await model.Organization.create({
            name: '학부총학생회',
        });
    });

    after(function () {
        stubValidateOrganization.restore();
        stubValidateIsAdmin.restore();
        stubValidateAuditPeriodByYearAndHalf.restore();
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

    describe('GET /:organization_id/:year/:half', function () {
        it('해당 연도, 분기의 피감기구 예산안을 조회할 수 있다', async function () {
            const budget = await model.Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });
            await createDummyBudget(budget.id);

            const res = await chai
                .request(app)
                .get(`/budgets/${organization.id}/2023/spring`);
            expect(res.status).eql(200);
            expect(res.body).eql(expectedBudget(budget.id));
        });
    });

    describe('GET /report/:organization_id/:year/:half', function () {
        it('해당 연도, 분기의 피감기구 결산을 조회할 수 있다', async function () {
            const budget = await model.Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });
            await createDummyBudget(budget.id);

            const res = await chai
                .request(app)
                .get(`/budgets/report/${organization.id}/2023/spring`);
            expect(res.status).eql(200);
            expect(res.body).eql(expectedSettlement(budget.id));
        });
    });

    describe('GET /report/total/:organization_id/:year/:half', function () {
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
                .get(`/budgets/report/total/${organization.id}/2023/spring`);
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
    await createExpenseTransaction('복리후생비', 0, expense402.id);

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
    await createExpenseTransaction('회의비', 0, expense403.id);

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

function expectedBudget(budget_id: string | number) {
    return {
        id: budget_id,
        담당자: '김넙죽',
        연도: 2023,
        반기: 'spring',
        피감기구: '학부총학생회',
        수입총계: {
            예산: 2358094,
        },
        지출총계: {
            예산: 1843856,
        },
        수입: [
            {
                재원: '학생회비',
                수입소계: {
                    예산: 2356094,
                },
                items: [
                    {
                        예산분류: '중앙회계',
                        items: [
                            {
                                항목: '중앙회계 지원금',
                                코드: '101',
                                예산: 180000,
                                비고: '',
                            },
                            {
                                항목: '중앙회계 이월금',
                                코드: '102',
                                예산: 632238,
                                비고: '',
                            },
                        ],
                    },
                    {
                        예산분류: '격려기금',
                        items: [
                            {
                                항목: '격려금',
                                코드: '103',
                                예산: 1543856,
                                비고: '',
                            },
                        ],
                    },
                ],
            },
            {
                재원: '자치',
                수입소계: {
                    예산: 2000,
                },
                items: [
                    {
                        예산분류: '예금이자',
                        items: [
                            {
                                항목: '예금이자',
                                코드: '301',
                                예산: 2000,
                                비고: '',
                            },
                        ],
                    },
                ],
            },
        ],
        지출: [
            {
                재원: '학생회비',
                지출소계: {
                    예산: 1843856,
                },
                items: [
                    {
                        예산분류: '운영비',
                        items: [
                            {
                                사업: '격려기금',
                                항목: '격려금',
                                코드: '401',
                                예산: 1543856,
                                비고: '',
                            },
                        ],
                    },
                    {
                        예산분류: '정기사업비',
                        items: [
                            {
                                사업: '감사원 LT',
                                항목: '복리후생비',
                                코드: '402',
                                예산: 120000,
                                비고: '',
                            },
                        ],
                    },
                    {
                        예산분류: '회의비',
                        items: [
                            {
                                사업: '감사원 회의',
                                항목: '회의비',
                                코드: '403',
                                예산: 120000,
                                비고: '내부 문제로 LT 사업 진행하지 않아 미집행',
                            },
                        ],
                    },
                    {
                        예산분류: '비정기사업비',
                        items: [
                            {
                                사업: '사무소모품 및 유지',
                                항목: '복리후생비',
                                코드: '404',
                                예산: 60000,
                                비고: '',
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

function expectedSettlement(budget_id: string | number) {
    return {
        id: budget_id,
        담당자: '김넙죽',
        연도: 2023,
        반기: 'spring',
        피감기구: '학부총학생회',
        수입총계: {
            예산: 2358094,
            결산: 869392,
            비율: 0.3687,
        },
        지출총계: {
            예산: 1843856,
            결산: 247811,
            비율: 0.1344,
        },
        수입: [
            {
                재원: '학생회비',
                수입소계: {
                    예산: 2356094,
                    결산: 869131,
                    비율: 0.3689,
                },
                items: [
                    {
                        예산분류: '중앙회계',
                        items: [
                            {
                                항목: '중앙회계 지원금',
                                코드: '101',
                                예산: 180000,
                                결산: 180000,
                                비율: 1.0,
                                비고: '',
                            },
                            {
                                항목: '중앙회계 이월금',
                                코드: '102',
                                예산: 632238,
                                결산: 502690,
                                비율: 0.7951,
                                비고: '',
                            },
                        ],
                    },
                    {
                        예산분류: '격려기금',
                        items: [
                            {
                                항목: '격려금',
                                코드: '103',
                                예산: 1543856,
                                결산: 186441,
                                비율: 0.1208,
                                비고: '',
                            },
                        ],
                    },
                ],
            },
            {
                재원: '자치',
                수입소계: {
                    예산: 2000,
                    결산: 261,
                    비율: 0.1305,
                },
                items: [
                    {
                        예산분류: '예금이자',
                        items: [
                            {
                                항목: '예금이자',
                                코드: '301',
                                예산: 2000,
                                결산: 261,
                                비율: 0.1305,
                                비고: '',
                            },
                        ],
                    },
                ],
            },
        ],
        지출: [
            {
                재원: '학생회비',
                지출소계: {
                    예산: 1843856,
                    결산: 247811,
                    비율: 0.1344,
                },
                items: [
                    {
                        예산분류: '운영비',
                        items: [
                            {
                                사업: '격려기금',
                                항목: '격려금',
                                코드: '401',
                                예산: 1543856,
                                결산: 186441,
                                비율: 0.1208,
                                비고: '',
                            },
                        ],
                    },
                    {
                        예산분류: '정기사업비',
                        items: [
                            {
                                사업: '감사원 LT',
                                항목: '복리후생비',
                                코드: '402',
                                예산: 120000,
                                결산: 0,
                                비율: 0,
                                비고: '',
                            },
                        ],
                    },
                    {
                        예산분류: '회의비',
                        items: [
                            {
                                사업: '감사원 회의',
                                항목: '회의비',
                                코드: '403',
                                예산: 120000,
                                결산: 0,
                                비율: 0,
                                비고: '내부 문제로 LT 사업 진행하지 않아 미집행',
                            },
                        ],
                    },
                    {
                        예산분류: '비정기사업비',
                        items: [
                            {
                                사업: '사무소모품 및 유지',
                                항목: '복리후생비',
                                코드: '404',
                                예산: 60000,
                                결산: 61370,
                                비율: 1.0228,
                                비고: '',
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

function expectedTotal(budget_id: string | number) {
    return {
        id: budget_id,
        담당자: '김넙죽',
        연도: 2023,
        반기: 'spring',
        피감기구: '학부총학생회',
        총계: {
            수입: {
                예산: 2358094,
                결산: 869392,
                비율: 0.3687,
            },
            지출: {
                예산: 1843856,
                결산: 247811,
                비율: 0.1344,
            },
            잔액: {
                예산: 514238,
                결산: 621581,
            },
        },
        학생회비: {
            수입: {
                예산: 2356094,
                결산: 869131,
                비율: 0.3689,
            },
            지출: {
                예산: 1843856,
                결산: 247811,
                비율: 0.1344,
            },
            잔액: {
                예산: 512238,
                결산: 621320,
            },
        },
        본회계: {
            수입: {
                예산: 0,
                결산: 0,
                비율: '-',
            },
            지출: {
                예산: 0,
                결산: 0,
                비율: '-',
            },
            잔액: {
                예산: 0,
                결산: 0,
            },
        },
        자치: {
            수입: {
                예산: 2000,
                결산: 261,
                비율: 0.1305,
            },
            지출: {
                예산: 0,
                결산: 0,
                비율: '-',
            },
            잔액: {
                예산: 2000,
                결산: 261,
            },
        },
    };
}
