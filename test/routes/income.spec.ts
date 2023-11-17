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

chai.use(chaiHttp);

describe('income router', () => {
    var clock: sinon.SinonFakeTimers;
    var budget: Budget;

    before(async function () {
        await initDB();
    });

    beforeEach(async () => {
        const organization = await Organization.create({
            name: '학부총학생회',
        });

        await AuditPeriod.create({
            year: 2023,
            half: 'spring',
            start: new Date('2023-01-01'),
            end: new Date('2023-06-30'),
        });

        budget = await Budget.create({
            OrganizationId: organization.id,
            year: 2023,
            half: 'spring',
            manager: '김넙죽',
        });
    });

    afterEach(async () => {
        await Income.destroy({
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

    describe('POST /:budget.id', () => {
        it('should create income item', async () => {
            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/income/${budget.id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(200);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const res = await chai
                .request(app)
                .post(`/budgets/income/${budget.id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 200000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('PUT /:income_id', () => {
        it('should update income item', async () => {
            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget.id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/income/${income.id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(200);

            const updatedIncome = await Income.findByPk(income.id);
            expect(updatedIncome?.amount).to.be.equal(300000);
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget.id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .put(`/budgets/income/${income.id}`)
                .send({
                    code: '101',
                    source: '학생회비',
                    category: '중앙회계',
                    content: '중앙회계지원금',
                    amount: 300000,
                    note: '',
                });
            expect(res).to.have.status(403);
        });
    });

    describe('DELETE /:income_id', () => {
        it('should delete income item', async () => {
            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget.id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/income/${income.id}`);
            expect(res).to.have.status(200);

            const deletedIncome = await Income.findByPk(income.id);
            expect(deletedIncome).to.be.null;
        });

        it('should return 403 when the audit period is not within the valid range', async () => {
            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            const income = await Income.create({
                BudgetId: budget.id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계지원금',
                amount: 200000,
                note: '',
            });

            const res = await chai
                .request(app)
                .delete(`/budgets/income/${income.id}`);
            expect(res).to.have.status(403);
        });
    });
});
