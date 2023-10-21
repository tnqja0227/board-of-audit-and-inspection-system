import chaiHttp from 'chai-http';
import app from '../../src/app';
import chai, { expect } from 'chai';
import { initDB } from '../../src/db/util';
import { Organization, User } from '../../src/model';

chai.use(chaiHttp);

describe('user router', () => {
    const mockEmail = 'test@kaist.ac.kr';
    let user: User;

    before(async function () {
        await initDB();
    });

    beforeEach(async function () {
        user = await User.create({
            email: mockEmail,
            password: 'test',
        });
    });

    afterEach(async function () {
        await Organization.destroy({
            truncate: true,
            cascade: true,
        });
        await User.destroy({
            truncate: true,
            cascade: true,
        });
    });

    describe('GET /', async () => {
        it('should return all users', async () => {
            const organization1 = await Organization.create({
                name: '학부총학생회',
            });
            const organization2 = await Organization.create({
                name: '감사원',
            });
            const organization3 = await Organization.create({
                name: '동아리연합회',
            });

            const user1 = await User.create({
                email: 'test1@kaist.ac.kr',
                password: 'test',
                OrganizationId: organization1.id,
            });
            const user2 = await User.create({
                email: 'test2@kaist.ac.kr',
                password: 'test',
                OrganizationId: organization2.id,
            });
            const user3 = await User.create({
                email: 'test3@kaist.ac.kr',
                password: 'test',
                OrganizationId: organization3.id,
            });

            const res = await chai.request(app).get('/users');
            expect(res.body.map((budget: any) => budget.organization_name)).eql(
                ['감사원', '동아리연합회', '학부총학생회'],
            );
        });
    });

    describe('PUT /disable', async () => {
        it('should disable user', async () => {
            await chai.request(app).put('/users/disable').send({
                email: mockEmail,
            });

            const updatedUser = await User.findOne({
                where: {
                    email: mockEmail,
                },
            });
            expect(updatedUser?.isDisabled).to.be.true;
        });
    });

    describe('PUT /enable', async () => {
        it('should enable user', async () => {
            await chai.request(app).put('/users/enable').send({
                email: mockEmail,
            });
            const updatedUser = await User.findOne({
                where: {
                    email: mockEmail,
                },
            });
            expect(updatedUser?.isDisabled).to.be.false;
        });
    });
});
