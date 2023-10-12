//@ts-nocheck

import { expect } from 'chai';
import sinon from 'sinon';
import { validateAuditPeriod } from '../../src/middleware/validate';
import { Request, Response, NextFunction } from 'express';
import { AuditPeriod, Budget } from '../../src/model';

describe('validate', () => {
    describe('validateAuditPeriod', () => {
        var budgetStub: sinon.SinonStub;
        var auditPeriodStub: sinon.SinonStub;
        var clock: sinon.SinonFakeTimers;
        var req: Request;
        var res: Response;

        beforeEach(() => {
            req = { params: { budget_id: 1 } } as any as Request;
            res = {
                sendStatus: sinon.spy(),
            } as any as Response;

            const budget = {
                year: 2023,
                half: 'spring',
            } as any as Budget;

            const auditPeriod = {
                start: new Date('2023-01-01'),
                end: new Date('2023-06-30'),
            } as any as AuditPeriod;

            budgetStub = sinon.stub(Budget, 'findByPk').resolves(budget);
            auditPeriodStub = sinon
                .stub(AuditPeriod, 'findOne')
                .resolves(auditPeriod);
        });

        afterEach(() => {
            budgetStub.restore();
            auditPeriodStub.restore();
            clock.restore();
        });

        it('should pass when the audit period is valid', async () => {
            const next = sinon.spy();

            clock = sinon.useFakeTimers({
                now: new Date(2023, 3, 1, 0, 0),
            });

            await validateAuditPeriod(req, res, next);
            expect(next.calledOnce).to.be.true;
        });

        it('should return a 403 status when the audit period is not within the valid range', async () => {
            const next = sinon.spy();

            clock = sinon.useFakeTimers({
                now: new Date(2023, 7, 1, 0, 0),
            });

            await validateAuditPeriod(req, res, next);

            expect(res.sendStatus.calledOnceWith(403)).to.be.true;
            expect(next.notCalled).to.be.true;
        });
    });
});
