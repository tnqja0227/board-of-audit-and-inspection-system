import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { initDB } from '../../src/db/utils';
import * as auth from '../../src/middleware/auth';
import * as model from '../../src/model';
import { createApp } from '../../src/app';
import * as Mock from '../mock';

chai.use(chaiHttp);

describe('API /users', function () {
    let app: Express.Application;
    var stubValidateIsAdmin: sinon.SinonStub;
    let stubGeneratedRandomPassword: sinon.SinonStub;

    before(async function () {
        await initDB();

        stubValidateIsAdmin = sinon
            .stub(auth, 'validateIsAdmin')
            .callsFake(async (req, res, next) => {
                return next();
            });

        const CreateUserDto =
            require('../../src/dto/user.request').CreateUserDto;
        stubGeneratedRandomPassword = sinon
            .stub(CreateUserDto.prototype, 'generateRandomPassword')
            .returns(Mock.mockPassword);

        app = createApp();
    });

    after(function () {
        stubValidateIsAdmin.restore();
        stubGeneratedRandomPassword.restore();
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.Organization.destroy(options);
        await model.User.destroy(options);
    });

    describe('GET /', async function () {
        let organization1: model.Organization;
        let organization2: model.Organization;
        let organization3: model.Organization;

        beforeEach(async function () {
            organization1 = await model.Organization.create(
                Mock.mockOrganization1,
            );
            organization2 = await model.Organization.create(
                Mock.mockOrganization2,
            );
            organization3 = await model.Organization.create(
                Mock.mockOrganization3,
            );
            await chai.request(app).post('/users').send({
                email: Mock.mockEmail1,
                organization_name: organization1.name,
            });
            await chai.request(app).post('/users').send({
                email: Mock.mockEmail2,
                organization_name: organization2.name,
            });
            await chai.request(app).post('/users').send({
                email: Mock.mockEmail3,
                organization_name: organization3.name,
            });
        });

        it('피감기구 별로 계정 정보를 조회한다.', async function () {
            const res = await chai.request(app).get('/users');

            expect(res.status).to.equal(200);
            expect(res.body.map((user: any) => user.organization_name)).eql([
                Mock.mockOrganization2.name,
                Mock.mockOrganization3.name,
                Mock.mockOrganization1.name,
            ]);
            expect(res.body.map((user: any) => user.email)).eql([
                Mock.mockEmail2,
                Mock.mockEmail3,
                Mock.mockEmail1,
            ]);
            expect(res.body.map((user: any) => user.password)).eql([
                Mock.mockPassword,
                Mock.mockPassword,
                Mock.mockPassword,
            ]);
        });

        it('비밀번호를 변경한 계정은 비밀번호를 null로 반환한다.', async function () {
            const user = await model.User.findOne({
                where: {
                    email: Mock.mockEmail1,
                },
            });
            user!.password = 'new_password';
            await user!.save();

            const res = await chai.request(app).get('/users');

            expect(res.status).to.equal(200);
            expect(res.body.map((user: any) => user.organization_name)).eql([
                Mock.mockOrganization2.name,
                Mock.mockOrganization3.name,
                Mock.mockOrganization1.name,
            ]);
            expect(res.body.map((user: any) => user.email)).eql([
                Mock.mockEmail2,
                Mock.mockEmail3,
                Mock.mockEmail1,
            ]);
            expect(res.body[0].password).not.to.be.null;
            expect(res.body[1].password).not.to.be.null;
            expect(res.body[2].password).to.be.null;
        });
    });

    describe('POST /', function () {
        it('새로운 계정을 추가할 수 있다.', async function () {
            const organization = await model.Organization.create(
                Mock.mockOrganization1,
            );

            const res = await chai.request(app).post('/users').send({
                email: Mock.mockEmail1,
                organization_name: organization.name,
            });
            expect(res.status).to.equal(200);
            expect(res.body.email).to.equal(Mock.mockEmail1);
            expect(res.body.password).to.equal(Mock.mockPassword);
            expect(res.body.role).to.equal('user');
            expect(res.body.is_disabled).to.be.false;
            expect(res.body.organization_id).to.equal(organization.id);
        });

        it('새로운 관리자 계정을 추가할 수 있다.', async function () {
            let res = await chai.request(app).post('/users/admin').send({
                email: Mock.mockEmail1,
                password: Mock.mockPassword,
            });
            expect(res.status).to.equal(200);
            expect(res.body.email).to.equal(Mock.mockEmail1);
            expect(res.body.role).to.equal('admin');

            res = await chai.request(app).post('/users/login').send({
                email: Mock.mockEmail1,
                password: Mock.mockPassword,
            });
            expect(res.status).to.equal(200);
        });

        it('이미 등록된 피감기구의 계정을 추가할 수 없다.', async function () {
            const organization = await model.Organization.create(
                Mock.mockOrganization1,
            );
            await model.User.create(Mock.createMockUser1(organization.id));

            const res = await chai.request(app).post('/users').send({
                email: Mock.mockEmail2,
                organization_name: organization.name,
            });
            expect(res.status).to.equal(409);
        });

        it('이미 등록된 이메일의 계정을 추가할 수 없다.', async function () {
            const organization1 = await model.Organization.create(
                Mock.mockOrganization1,
            );
            const organization2 = await model.Organization.create(
                Mock.mockOrganization2,
            );

            await model.User.create(Mock.createMockUser1(organization1.id));

            const res = await chai.request(app).post('/users').send({
                email: Mock.mockEmail1,
                organization_name: organization2.name,
            });
            expect(res.status).to.equal(409);
        });
    });

    describe('POST /login', async function () {
        beforeEach(async function () {
            const organization = await model.Organization.create(
                Mock.mockOrganization1,
            );

            await chai.request(app).post('/users').send({
                email: Mock.mockEmail1,
                organization_name: organization.name,
            });
        });

        afterEach(function () {
            const options = {
                truncate: true,
                cascade: true,
            };
            model.User.destroy(options);
            model.Organization.destroy(options);
        });

        it('로그인에 성공한다.', async function () {
            const res = await chai
                .request(app)
                .post('/users/login')
                .set('Accept', 'application/json')
                .send({
                    email: Mock.mockEmail1,
                    password: Mock.mockPassword,
                });
            expect(res.status).to.equal(200);
            expect(res.body.email).to.equal(Mock.mockEmail1);
            expect(res.body.role).to.equal('user');
            expect(res.body.is_disabled).to.be.false;
            expect(res.body.organization_name).to.equal(
                Mock.mockOrganization1.name,
            );
        });

        it('비밀번호가 일치하지 않으면 로그인에 실패한다.', async function () {
            const res = await chai.request(app).post('/users/login').send({
                email: Mock.mockEmail1,
                password: 'wrong_password',
            });
            expect(res.status).to.equal(401);
        });
    });

    describe('POST /password', async function () {
        it('비밀번호를 변경할 수 있다.', async function () {
            const organization = await model.Organization.create(
                Mock.mockOrganization1,
            );
            await chai.request(app).post('/users').send({
                email: Mock.mockEmail1,
                organization_name: organization.name,
            });

            let res = await chai.request(app).post('/users/password').send({
                email: Mock.mockEmail1,
                password: Mock.mockPassword,
                new_password: 'new_password',
            });
            expect(res.status).to.equal(200);

            res = await chai.request(app).post('/users/login').send({
                email: Mock.mockEmail1,
                password: 'new_password',
            });
            expect(res.status).to.equal(200);

            res = await chai.request(app).post('/users/login').send({
                email: Mock.mockEmail1,
                password: Mock.mockPassword,
            });
            expect(res.status).to.equal(401);
        });
    });

    describe('PUT /disable', async function () {
        it('계정을 비활성화 할 수 있다.', async function () {
            const organization = await model.Organization.create(
                Mock.mockOrganization1,
            );
            await model.User.create(Mock.createMockUser1(organization.id));

            const res = await chai.request(app).put('/users/disable').send({
                email: Mock.mockEmail1,
            });
            expect(res.status).to.equal(200);

            const disabledUser = await model.User.findOne({
                where: {
                    email: Mock.mockEmail1,
                },
            });
            expect(disabledUser?.isDisabled).to.be.true;
        });
    });

    describe('PUT /enable', async function () {
        it('계정을 활성화 할 수 있다.', async function () {
            const organization = await model.Organization.create(
                Mock.mockOrganization1,
            );
            await model.User.create(Mock.createMockUser1(organization.id));

            const res = await chai.request(app).put('/users/enable').send({
                email: Mock.mockEmail1,
            });
            expect(res.status).to.equal(200);

            const disabledUser = await model.User.findOne({
                where: {
                    email: Mock.mockEmail1,
                },
            });
            expect(disabledUser?.isDisabled).to.be.false;
        });
    });
});
