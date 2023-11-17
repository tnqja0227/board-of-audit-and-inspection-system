import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import {
    AuditPeriod,
    Budget,
    Organization,
    Income,
    Expense,
} from '../../src/model';
import {
    findAuditPeriodAndValidate,
    findYearAndHalfByIncomeId,
    findYearAndHalfByExpenseId,
} from '../../src/middleware/validate_audit_period';
import { NotFoundError, ValidationError } from '../../src/utils/errors';
import { initDB } from '../../src/db/util';

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
    before(async function () {
        await initDB();
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await AuditPeriod.destroy(options);
        await Budget.destroy(options);
        await Organization.destroy(options);
        await Income.destroy(options);
        await Expense.destroy(options);
    });

    describe('findAuditPeriodAndValidate', function () {
        var clock: sinon.SinonFakeTimers;

        afterEach(function () {
            clock.restore();
        });

        it('should pass when the audit period is valid', async function () {
            await AuditPeriod.create(dummyAuditPeriod);

            clock = sinon.useFakeTimers({
                now: validDate,
            });

            await findAuditPeriodAndValidate(2023, 'spring');
            expect(true).to.be.true;
        });

        it('should throw a NotFoundError when the audit period does not exist', async function () {
            clock = sinon.useFakeTimers({
                now: validDate,
            });

            expect(
                findAuditPeriodAndValidate(2023, 'spring'),
            ).to.eventually.be.rejectedWith(NotFoundError);
        });

        it('should throw a ValidationError when the audit period is not within the valid range', async function () {
            await AuditPeriod.create(dummyAuditPeriod);

            clock = sinon.useFakeTimers({
                now: invalidDate,
            });

            expect(
                findAuditPeriodAndValidate(2023, 'spring'),
            ).to.eventually.be.rejectedWith(ValidationError);
        });
    });

    describe('findYearAndHalfByIncomeId', function () {
        var income: Income;

        beforeEach(async function () {
            await AuditPeriod.create(dummyAuditPeriod);

            const organization = await Organization.create({
                name: '학부총학생회',
            });

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            income = await Income.create({
                source: '학생회비',
                code: '101',
                category: '운영비',
                content: '운영비',
                amount: 1000000,
                BudgetId: budget.id,
            });
        });

        it('should return the year and half of the income', async function () {
            const { year, half } = await findYearAndHalfByIncomeId(income.id);
            expect(year).to.equal(2023);
            expect(half).to.equal('spring');
        });

        it('should throw a NotFoundError when the income does not exist', async () => {
            expect(
                findYearAndHalfByIncomeId(999),
            ).to.eventually.be.rejectedWith(NotFoundError);
        });
    });

    describe('findYearAndHalfByExpenseId', () => {
        var expense: Expense;

        beforeEach(async () => {
            await AuditPeriod.create(dummyAuditPeriod);

            const organization = await Organization.create({
                name: '학부총학생회',
            });

            const budget = await Budget.create({
                OrganizationId: organization.id,
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
            });

            expense = await Expense.create({
                source: '학생회비',
                code: '401',
                category: '운영비',
                project: '운영비',
                content: '운영비',
                amount: 1000000,
                BudgetId: budget.id,
            });
        });

        it('should return the year and half of the expense', async () => {
            const { year, half } = await findYearAndHalfByExpenseId(expense.id);
            expect(year).to.equal(2023);
            expect(half).to.equal('spring');
        });

        it('should throw a NotFoundError when the expense does not exist', async () => {
            expect(
                findYearAndHalfByExpenseId(999),
            ).to.eventually.be.rejectedWith(NotFoundError);
        });
    });
});
