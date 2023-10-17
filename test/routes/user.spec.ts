import chaiHttp from 'chai-http';
import app from '../../src/app';
import chai, { expect } from 'chai';
import { initDB } from '../../src/db/util';
import { User } from '../../src/model';

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
        await User.destroy({
            truncate: true,
            cascade: true,
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
