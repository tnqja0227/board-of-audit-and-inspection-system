import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as auth from '../../src/middleware/auth';
import * as model from '../../src/model';
import { initDB } from '../../src/db/utils';
import { createApp } from '../../src/app';
import { readFileSync } from 'fs';
import * as s3Service from '../../src/config/s3';
import * as validate_audit_period from '../../src/middleware/validate_audit_period';

chai.use(chaiHttp);

const ORGANIZATION_NAME = '감사원';
const YEAR = '2023';
const HALF = 'spring';

const KEY = 'test.jpg';
const TEST_IMAGE_PATH = './test/assets/image1.jpg';
const TEST_IMAGE = readFileSync(TEST_IMAGE_PATH);
const FILENAME = 'test.jpg';

describe('API /card_records', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    var stubValidateAuditPeriod: sinon.SinonStub;
    let organization: model.Organization;

    var stubS3Upload: sinon.SinonStub;
    var stubS3Delete: sinon.SinonStub;

    before(async function () {
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
            .callsFake(async (req, res, next) => {
                return next();
            });

        stubValidateAuditPeriod = sinon
            .stub(validate_audit_period, 'validateAuditPeriod')
            .callsFake(async (req, res, next) => {
                return next();
            });

        stubS3Upload = sinon
            .stub(s3Service, 'uploadFileToS3')
            .callsFake(async (file, URI) => {
                return Promise.resolve({
                    statusCode: 200,
                });
            });

        stubS3Delete = sinon
            .stub(s3Service, 'deleteFileFromS3')
            .callsFake(async (URI) => {
                return Promise.resolve({
                    statusCode: 204,
                });
            });
        app = createApp();
    });

    after(function () {
        stubValidateOrganization.restore();
        stubValidateAuditPeriod.restore();
        stubS3Upload.restore();
        stubS3Delete.restore();
    });

    beforeEach(async function () {
        organization = await model.Organization.create({
            name: ORGANIZATION_NAME,
        });
    });

    afterEach(async function () {
        const options = {
            truncate: true,
            cascade: true,
        };
        await model.Organization.destroy(options);
        await model.CardRecord.destroy(options);
    });

    describe('GET /:organization_id/:year/:half', function () {
        it('피감기관의 카드 지출 내역 증빙 자료를 조회할 수 있다.', async function () {
            const record = await model.CardRecord.create({
                OrganizationId: organization.id,
                year: YEAR,
                half: HALF,
                URI: 'test1.jpg',
            });

            const res = await chai
                .request(app)
                .get(`/card_records/${organization.id}/${YEAR}/${HALF}`);

            expect(res).to.have.status(200);
            expect(res.body.OrganizationId).to.equal(organization.id);
            expect(res.body.URI).to.equal(s3Service.s3keyToUri(record.URI));
        });
    });

    describe('POST /:organization_id/:year/:half', function () {
        it('피감기관의 카드 거래 내역 증빙 자료를 추가할 수 있다.', async function () {
            const res = await chai
                .request(app)
                .post(`/card_records/${organization.id}/${YEAR}/${HALF}`)
                .set('Content-Type', 'multipart/form-data')
                .attach('file', TEST_IMAGE, FILENAME);

            expect(res).to.have.status(200);
            const cardRecord = await model.CardRecord.findOne({
                where: {
                    OrganizationId: organization.id,
                    year: YEAR,
                    half: HALF,
                },
            });
            const key = `${organization.name}/${YEAR}/${HALF}/card_records/${FILENAME}`;
            expect(key).to.equal(cardRecord!.URI);
        });

        it('같은 피감기구 및 회계연도, 반기에 이미 증빙 자료가 존재할 경우, 기존의 증빙자료를 덮어쓰기한다.', async function () {
            const cardRecord = await model.CardRecord.create({
                OrganizationId: organization.id,
                year: YEAR,
                half: HALF,
                URI: 'test1.jpg',
            });

            const res = await chai
                .request(app)
                .post(`/card_records/${organization.id}/${YEAR}/${HALF}`)
                .set('Content-Type', 'multipart/form-data')
                .attach('file', TEST_IMAGE, FILENAME);

            expect(res).to.have.status(200);
            expect(res.body.URI).not.to.equal(cardRecord.URI);
            const key = `${organization.name}/${YEAR}/${HALF}/card_records/${FILENAME}`;
            expect(res.body.URI).to.equal(s3Service.s3keyToUri(key));
        });
    });

    describe('DELETE /:card_record_id', function () {
        it('피감기관의 카드 거래 내역 증빙 자료를 삭제할 수 있다.', async function () {
            const cardRecord = await model.CardRecord.create({
                OrganizationId: organization.id,
                year: YEAR,
                half: HALF,
                URI: KEY,
            });

            const res = await chai
                .request(app)
                .delete(`/card_records/${cardRecord.id}`);
            expect(res).to.have.status(200);
            const cardRecords = await model.CardRecord.findAll({
                where: {
                    id: cardRecord.id,
                },
            });
            expect(cardRecords.length).to.equal(0);
        });
    });
});
