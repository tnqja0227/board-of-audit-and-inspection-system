import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../../src/db/utils';
import * as auth from '../../../src/middleware/auth';
import { createApp } from '../../../src/app';
import * as model from '../../../src/model';

chai.use(chaiHttp);

describe('API /budgets/period', function () {
    let app: Express.Application;
    let stubValidateIsAdmin: sinon.SinonStub;

    before(async function () {
        await initDB();

        stubValidateIsAdmin = sinon
            .stub(auth, 'validateIsAdmin')
            .callsFake(async (req, res, next) => {
                return next();
            });

        app = createApp();
    });

    after(async function () {
        stubValidateIsAdmin.restore();
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.AuditPeriod.destroy(options);
    });

    describe('GET /', function () {
        it('모든 감사기간을 조회할 수 있다.', async function () {
            await model.AuditPeriod.create({
                year: '2024',
                half: 'spring',
                start: '2024-03-01',
                end: '2024-06-30',
            });
            await model.AuditPeriod.create({
                year: '2024',
                half: 'fall',
                start: '2024-09-01',
                end: '2024-12-31',
            });
            await model.AuditPeriod.create({
                year: '2023',
                half: 'fall',
                start: '2023-09-01',
                end: '2023-12-31',
            });
            await model.AuditPeriod.create({
                year: '2023',
                half: 'spring',
                start: '2023-03-01',
                end: '2023-06-30',
            });

            const res = await chai.request(app).get('/budgets/period');
            expect(res).to.have.status(200);
            expect(res.body[0].year).to.equal(2023);
            expect(res.body[0].half).to.equal('spring');
            expect(new Date(res.body[0].start)).eql(new Date('2023-03-01'));
            expect(new Date(res.body[0].end)).eql(new Date('2023-06-30'));
            expect(res.body[1].year).to.equal(2023);
            expect(res.body[1].half).to.equal('fall');
            expect(new Date(res.body[1].start)).eql(new Date('2023-09-01'));
            expect(new Date(res.body[1].end)).eql(new Date('2023-12-31'));
            expect(res.body[2].year).to.equal(2024);
            expect(res.body[2].half).to.equal('spring');
            expect(new Date(res.body[2].start)).eql(new Date('2024-03-01'));
            expect(new Date(res.body[2].end)).eql(new Date('2024-06-30'));
            expect(res.body[3].year).to.equal(2024);
            expect(res.body[3].half).to.equal('fall');
            expect(new Date(res.body[3].start)).eql(new Date('2024-09-01'));
            expect(new Date(res.body[3].end)).eql(new Date('2024-12-31'));
        });
    });

    describe('POST /:year/:half', function () {
        it('감사기간을 생성할 수 있다.', async function () {
            const res = await chai
                .request(app)
                .post('/budgets/period/2023/spring')
                .send({
                    start: '2023-03-01',
                    end: '2023-06-30',
                });

            expect(res).to.have.status(200);
            expect(res.body.year).to.equal(2023);
            expect(res.body.half).to.equal('spring');
            expect(new Date(res.body.start)).eql(new Date('2023-03-01'));
            expect(new Date(res.body.end)).eql(new Date('2023-06-30'));
        });
    });

    describe('PUT /:year/:half', function () {
        it('감사기간을 변경할 수 있다.', async function () {
            await model.AuditPeriod.create({
                year: '2023',
                half: 'spring',
                start: '2023-03-01',
                end: '2023-06-30',
            });

            const res = await chai
                .request(app)
                .put('/budgets/period/2023/spring')
                .send({
                    start: '2023-03-01',
                    end: '2023-07-10',
                });
            expect(res).to.have.status(200);

            const updatedPeriod = await model.AuditPeriod.findOne({
                where: {
                    year: '2023',
                    half: 'spring',
                },
            });
            expect(new Date(updatedPeriod!.start)).eql(new Date('2023-03-01'));
            expect(new Date(updatedPeriod!.end)).eql(new Date('2023-07-10'));
        });
    });
});
