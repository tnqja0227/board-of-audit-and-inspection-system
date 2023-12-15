import { expect } from 'chai';
import sinon from 'sinon';
import { initDB } from '../../src/db/utils';
import * as auth from '../../src/middleware/auth';
import { Request, Response } from 'express';
import * as model from '../../src/model';
import * as errors from '../../src/utils/errors';

describe('Middleware: auth', function () {
    afterEach(function () {
        sinon.restore();
    });

    describe('validateIsAdmin', function () {
        it('관리자 계정일경우 next()를 호출한다.', async function () {
            const req = {
                session: {
                    user: {
                        id: 1,
                        role: 'admin',
                    },
                },
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            await auth.validateIsAdmin(req, res, next);
            expect(next.calledOnce).to.be.true;
        });

        it('세션이 존재하지 않을 경우 UnauthorizedError를 발생시킨다.', async function () {
            const req = {
                session: {},
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            expect(
                auth.validateIsAdmin(req, res, next),
            ).eventually.be.rejectedWith(errors.UnauthorizedError);
            expect(next.calledOnce).to.be.false;
        });

        it('관리자 계정이 아닐 경우 UnauthorizedError를 발생시킨다.', async function () {
            const req = {
                session: {
                    user: {
                        role: 'user',
                    },
                },
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            expect(
                auth.validateIsAdmin(req, res, next),
            ).eventually.be.rejectedWith(errors.UnauthorizedError);
            expect(next.calledOnce).to.be.false;
        });
    });

    describe('validateOrganization', function () {
        it('세션의 OrganizationId와 요청의 OrganizationId가 일치할 경우 next()를 호출한다.', async function () {
            const req = {
                session: {
                    user: {
                        id: 1,
                        role: 'user',
                        OrganizationId: 1,
                    },
                },
                params: {
                    organization_id: 1,
                },
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            await auth.validateOrganization(req, res, next);
            expect(next.calledOnce).to.be.true;
        });

        it('관리자 계정일 경우 next()를 호출한다.', async function () {
            const req = {
                session: {
                    user: {
                        role: 'admin',
                    },
                },
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            await auth.validateOrganization(req, res, next);
            expect(next.calledOnce).to.be.true;
        });

        it('세션이 존재하지 않을 경우 UnauthorizedError를 발생시킨다.', async function () {
            const req = {
                session: {},
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            expect(
                auth.validateOrganization(req, res, next),
            ).eventually.be.rejectedWith(errors.UnauthorizedError);
            expect(next.calledOnce).to.be.false;
        });

        it('세션의 OrganizationId가 존재하지 않을 경우 UnauthorizedError를 발생시킨다.', async function () {
            const req = {
                session: {
                    user: {
                        role: 'user',
                    },
                },
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            expect(
                auth.validateOrganization(req, res, next),
            ).eventually.be.rejectedWith(errors.UnauthorizedError);
            expect(next.calledOnce).to.be.false;
        });

        it('세션의 OrganizationId와 요청의 OrganizationId가 일치하지 않을 경우 UnauthorizedError를 발생시킨다.', async function () {
            const req = {
                session: {
                    user: {
                        role: 'user',
                        OrganizationId: 1,
                    },
                },
                params: {
                    organization_id: 2,
                },
            } as any as Request;
            const res = {} as Response;
            const next = sinon.spy();

            expect(
                auth.validateOrganization(req, res, next),
            ).eventually.be.rejectedWith(errors.UnauthorizedError);
            expect(next.calledOnce).to.be.false;
        });
    });

    describe('findRequestedOrganization', function () {
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
                year: 2023,
                half: 'spring',
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
            await model.Income.destroy(options);
            await model.Expense.destroy(options);
            await model.Budget.destroy(options);
            await model.Organization.destroy(options);
        });

        it('요청에 organization_id가 있을경우 이를 반환한다.', async function () {
            const req = {
                params: {
                    organization_id: 1,
                },
                body: {},
            } as any as Request;

            const requestedOrganizationId =
                await auth.findRequestedOrganization(req);
            expect(requestedOrganizationId).to.equal(1);
        });

        it('요청에 budget_id가 있을 경우 organization_id를 반환한다.', async function () {
            const req = {
                params: {
                    budget_id: budget.id,
                },
                body: {},
            } as any as Request;

            const requestedOrganizationId =
                await auth.findRequestedOrganization(req);
            expect(requestedOrganizationId).to.equal(organization.id);
        });

        it('요청에 income_id가 있을 경우 organization_id를 반환한다.', async function () {
            const req = {
                params: {
                    income_id: income.id,
                },
                body: {},
            } as any as Request;

            const requestedOrganizationId =
                await auth.findRequestedOrganization(req);
            expect(requestedOrganizationId).to.equal(organization.id);
        });

        it('요청에 expense_id가 있을 경우 organization_id를 반환한다.', async function () {
            const req = {
                params: {
                    expense_id: expense.id,
                },
                body: {},
            } as any as Request;

            const requestedOrganizationId =
                await auth.findRequestedOrganization(req);
            expect(requestedOrganizationId).to.equal(organization.id);
        });
    });
});
