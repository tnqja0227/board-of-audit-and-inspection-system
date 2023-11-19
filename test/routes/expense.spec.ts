import chaiHttp from 'chai-http';
import app from '../../src/app';
import chai, { expect } from 'chai';
import {
    AuditPeriod,
    Budget,
    Expense,
    Income,
    Organization,
    Transaction,
} from '../../src/model';
import { initDB } from '../../src/db/util';
import sinon from 'sinon';

describe('expense router', () => {
    var clock: sinon.SinonFakeTimers;
    var budget_id: number;

    before(async () => {
        await initDB();
    });

    beforeEach(async () => {
        const organization = await Organization.create({
            name: '학부총학생회',
        });

        const budget = await Budget.create({
            OrganizationId: organization.id,
            year: 2023,
            half: 'spring',
            manager: '김넙죽',
        });
        budget_id = budget.id;
    });

    afterEach(async () => {
        await Expense.destroy({
            truncate: true,
            cascade: true,
        });
        await Budget.destroy({
            truncate: true,
            cascade: true,
        });
        await Organization.destroy({
            truncate: true,
            cascade: true,
        });
        await AuditPeriod.destroy({
            truncate: true,
            cascade: true,
        });
        clock.restore();
    });

    describe('POST /:budget_id', () => {
        it('should create expense item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/expense/${budget_id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(200);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/expense/${budget_id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('PUT /:expense_id', () => {
        it('should update expense item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/expense/${expense.id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(200);

            const updatedExpense = await Expense.findByPk(expense.id);
            expect(updatedExpense?.amount).to.be.equal(300000);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .put(`/budgets/expense/${expense.id}`)
                .send({
                    code: '401',
                    source: '학생회비',
                    category: '운영비',
                    project: '격려금',
                    content: '격려금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('DELETE /:expense_id', () => {
        it('should delete expense item', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/expense/${expense.id}`);
            expect(res).to.have.status(200);

            const deletedExpense = await Expense.findByPk(expense.id);
            expect(deletedExpense).to.be.null;
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            await AuditPeriod.create({
                year: 2023,
                half: 'spring',
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            });

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const expense = await Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려금',
                content: '격려금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/expense/${expense.id}`);
            expect(res).to.have.status(403);
        });
    });
});
