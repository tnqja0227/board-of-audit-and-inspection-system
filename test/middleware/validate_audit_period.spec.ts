import chai, { expect } from 'chai';
import { Request, Response, NextFunction } from 'express';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import * as model from '../../src/model';
import {
    findYearAndHalf,
    validateAuditPeriod,
} from '../../src/middleware/validate_audit_period';
import * as errors from '../../src/utils/errors';
import { initDB } from '../../src/db/utils';

chai.use(chaiAsPromised);

const dummyAuditPeriod = {
    year: 2023,
    half: 'spring',
    start: new Date('2023-01-01'),
    end: new Date('2023-06-30'),
};
const validDate = new Date('2023-04-01');
const invalidDate = new Date('2023-08-01');

describe('Middleware: validate_audit_period', function () {
    describe('validateAuditPeriod', function () {
        let clock: sinon.SinonFakeTimers;

        afterEach(function () {
            clock.restore();
            sinon.restore();
        });

        it('감사기간이 적절할 경우 next()를 호출한다.', async function () {
            const req = {
                params: {
                    year: dummyAuditPeriod.year,
                    half: dummyAuditPeriod.half,
                },
                body: {},
            } as any as Request;
            const res = {} as any as Response;
            const next = sinon.spy();
            clock = sinon.useFakeTimers(validDate);
            sinon
                .stub(model.AuditPeriod, 'findOne')
                .resolves(dummyAuditPeriod as any as model.AuditPeriod);

            await validateAuditPeriod(req, res, next);
            expect(next.calledOnce).to.be.true;
        });

        it('감사기간이 존재하지 않을 경우 NotFoundError를 발생시킨다.', async function () {
            const req = {
                params: {
                    year: dummyAuditPeriod.year,
                    half: dummyAuditPeriod.half,
                },
                body: {},
            } as any as Request;
            const res = {} as any;
            const next = sinon.spy();
            clock = sinon.useFakeTimers(validDate);
            sinon.stub(model.AuditPeriod, 'findOne').resolves(null);

            expect(
                validateAuditPeriod(req, res, next),
            ).eventually.be.rejectedWith(errors.NotFoundError);
            expect(next.calledOnce).to.be.false;
        });

        it('감사기간이 아닐 경우 ValidationError를 발생시킨다.', async function () {
            const req = {
                params: {
                    year: dummyAuditPeriod.year,
                    half: dummyAuditPeriod.half,
                },
                body: {},
            } as any as Request;
            const res = {} as any;
            const next = sinon.spy();
            clock = sinon.useFakeTimers(invalidDate);
            sinon
                .stub(model.AuditPeriod, 'findOne')
                .resolves(dummyAuditPeriod as any as model.AuditPeriod);

            expect(
                validateAuditPeriod(req, res, next),
            ).eventually.be.rejectedWith(errors.ValidationError);
            expect(next.calledOnce).to.be.false;
        });

        it('body에 income_id와 expense_id가 동시에 존재할 경우 BadRequestError를 발생시킨다.', async function () {
            const req = {
                body: {
                    income_id: 1,
                    expense_id: 1,
                },
            } as any as Request;
            const res = {} as any;
            const next = sinon.spy();

            expect(
                validateAuditPeriod(req, res, next),
            ).eventually.be.rejectedWith(errors.BadRequestError);
            expect(next.calledOnce).to.be.false;
        });
    });

    describe('findYearAndHalf', function () {
        let organization: model.Organization;
        let budget: model.Budget;
        let income: model.Income;
        let expense: model.Expense;

        before(async function () {
            await initDB();
        });

        beforeEach(async function () {
            organization = await model.Organization.create({
                name: '학부총학생회',
            });
            budget = await model.Budget.create({
                manager: '김넙죽',
                year: dummyAuditPeriod.year,
                half: dummyAuditPeriod.half,
                OrganizationId: organization.id,
            });
            income = await model.Income.create({
                code: '101',
                source: '학생회비',
                category: '운영비',
                content: '운영비',
                amount: 1000000,
                BudgetId: budget.id,
            });
            expense = await model.Expense.create({
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '운영비',
                content: '운영비',
                amount: 1000000,
                BudgetId: budget.id,
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
        });

        it('params에 year와 half가 존재할 경우 year와 half를 반환한다.', async function () {
            const req = {
                params: {
                    year: dummyAuditPeriod.year,
                    half: dummyAuditPeriod.half,
                },
                body: {},
            } as any as Request;

            const { year, half } = await findYearAndHalf(req);
            expect(year).to.be.equal(dummyAuditPeriod.year);
            expect(half).to.be.equal(dummyAuditPeriod.half);
        });

        it('params에 budget_id가 존재할 경우 budget_id를 이용해 year와 half를 반환한다.', async function () {
            const req = {
                params: {
                    budget_id: budget.id,
                },
                body: {},
            } as any as Request;

            const { year, half } = await findYearAndHalf(req);
            expect(year).to.be.equal(dummyAuditPeriod.year);
            expect(half).to.be.equal(dummyAuditPeriod.half);
        });

        it('params에 income_id가 존재할 경우 income_id를 이용해 year와 half를 반환한다.', async function () {
            const req = {
                params: {
                    income_id: income.id,
                },
                body: {},
            } as any as Request;

            const { year, half } = await findYearAndHalf(req);
            expect(year).to.be.equal(dummyAuditPeriod.year);
            expect(half).to.be.equal(dummyAuditPeriod.half);
        });

        it('body에 income_id가 존재할 경우 income_id를 이용해 year와 half를 반환한다.', async function () {
            const req = {
                params: {},
                body: {
                    income_id: income.id,
                },
            } as any as Request;

            const { year, half } = await findYearAndHalf(req);
            expect(year).to.be.equal(dummyAuditPeriod.year);
            expect(half).to.be.equal(dummyAuditPeriod.half);
        });

        it('params에 expense_id가 존재할 경우 expense_id를 이용해 year와 half를 반환한다.', async function () {
            const req = {
                params: {
                    expense_id: expense.id,
                },
                body: {},
            } as any as Request;

            const { year, half } = await findYearAndHalf(req);
            expect(year).to.be.equal(dummyAuditPeriod.year);
            expect(half).to.be.equal(dummyAuditPeriod.half);
        });

        it('body에 expense_id가 존재할 경우 expense_id를 이용해 year와 half를 반환한다.', async function () {
            const req = {
                params: {},
                body: {
                    expense_id: expense.id,
                },
            } as any as Request;

            const { year, half } = await findYearAndHalf(req);
            expect(year).to.be.equal(dummyAuditPeriod.year);
            expect(half).to.be.equal(dummyAuditPeriod.half);
        });

        it('params과 body를 이용해 year와 half를 찾을 수 없는 경우 BadRequestError를 발생시킨다.', async function () {
            const req = {
                params: {},
                body: {},
            } as any as Request;

            expect(findYearAndHalf(req)).eventually.be.rejectedWith(
                errors.BadRequestError,
            );
        });
    });
});
