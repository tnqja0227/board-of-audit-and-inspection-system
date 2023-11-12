import chaiHttp from 'chai-http';
import app from '../../src/app';
import chai, { expect } from 'chai';
import { initDB } from '../../src/db/util';
import sinon from 'sinon';
import { Budget, Income, Organization, Transaction } from '../../src/model';

chai.use(chaiHttp);

describe('transaction router', () => {
    before(async function () {
        await initDB();
    });

    describe('GET /', () => {
        it('should return all transactions', async () => {
            const organization = await Organization.create({
                name: '학부총학생회',
            });

            const budget = await Budget.create({
                year: 2021,
                half: 'spring',
                manager: '김넙죽',
                OrganizationId: organization.id,
            });

            const income = await Income.create({
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '예산',
                amount: 10000,
                BudgetId: budget.id,
            });

            const dates = [];
            const t = new Date('2021-01-01:00:00:00');
            for (var i = 0; i < 30; i++) {
                t.setDate(t.getDate() + 1);
                dates.push(new Date(t));
                await Transaction.create({
                    projectAt: t,
                    manager: '김넙죽',
                    content: '테스트',
                    type: '공금카드',
                    amount: 10000,
                    transactionAt: t,
                    accountNumber: '1234567890',
                    accountBank: '우리은행',
                    accountOwner: '김넙죽',
                    hasBill: false,
                    IncomeId: income.id,
                });
            }

            const expected_dates = dates
                .sort((a, b) => b.getTime() - a.getTime())
                .map((date) => date.toISOString())
                .slice(20, 30);

            const res = await chai
                .request(app)
                .get(`/transactions/${organization.id}/2021/spring?page=2`);
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');

            const actual_dates = res.body.map(
                (transaction: any) => transaction.transactionAt,
            );
            expect(actual_dates).eql(expected_dates);
        });
    });
});
