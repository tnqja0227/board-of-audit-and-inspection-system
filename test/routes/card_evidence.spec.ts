import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as auth from '../../src/middleware/auth';
import * as model from '../../src/model';
import { initDB } from '../../src/db/utils';
import { createApp } from '../../src/app';
import { readFileSync } from 'fs';
import * as s3Service from '../../src/service/s3';

chai.use(chaiHttp);

const ORGANIZATION_NAME = '감사원';
const YEAR = 2023;
const HALF = 'spring';

const NOTE = '비고'; // 비고
const KEY = 'test.jpg';
const TEST_IMAGE_PATH = './test/assets/image1.jpg';
const TEST_IMAGE = readFileSync(TEST_IMAGE_PATH);
const FILENAME = 'test.jpg';

describe('API /card_evidences', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    let organization: model.Organization;

    var stubS3Upload: sinon.SinonStub;
    var stubS3Delete: sinon.SinonStub;

    before(async function () {
        this.timeout(10000);
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
            .callsFake(async (req, res, next) => {
                return next();
            });

        stubS3Upload = sinon
            .stub(s3Service, 'uploadFileToS3')
            .callsFake(async (filepath, key) => {
                return Promise.resolve({
                    uri: `${process.env.AWS_S3_BUCKET_NAME}/${key}`,
                    statusCode: 200,
                });
            });

        stubS3Delete = sinon
            .stub(s3Service, 'deleteFileFromS3')
            .callsFake(async (key) => {
                return Promise.resolve({
                    statusCode: 200,
                });
            });
        app = createApp();
    });

    after(function () {
        stubValidateOrganization.restore();
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
    });

    describe('GET /:organization_id/:year/:half', function () {
        it('피감기관 별로 카드 지출 내역 증빙 자료를 조회할 수 있다.', async function () {
            const cardEvidence = await model.CardEvidence.create({
                organizationId: organization.id,
                year: YEAR,
                half: HALF,
                key: KEY,
            });

            const res = await chai
                .request(app)
                .get(`/card_evidences/${organization.id}/${YEAR}/${HALF}`);

            expect(res).to.have.status(200);
            expect(res.body.length).to.equal(1);
            expect(res.body[0].organizationId).to.equal(organization.id);
            expect(res.body[0].key).to.equal(KEY);
        });
    });

    describe('POST /:organizationId/:year/:half', function () {
        it('피감기관의 카드 거래 내역 증빙 자료를 추가할 수 있다.', async function () {
            const res = await chai
                .request(app)
                .post(`/card_evidences/${organization.id}/${YEAR}/${HALF}`)
                .set('Content-Type', 'multipart/form-data')
                .attach('file', TEST_IMAGE, FILENAME);

            expect(res).to.have.status(200);
            const cardEvidences = await model.CardEvidence.findAll({
                where: {
                    organizationId: organization.id,
                    year: YEAR,
                    half: HALF,
                },
            });
            const fileKey = `${organization.id}/${YEAR}/${HALF}/card_evidences`;
            expect(cardEvidences.length).to.equal(1);

            // FILENAME 앞 부분 folder까지가 일치해야 함.
            const fileKeyUptoFolder = cardEvidences[0].key
                .split('/')
                .slice(0, -1)
                .join('/');
            expect(fileKeyUptoFolder).to.equal(fileKey);
        });
    });

    describe('DELETE /:organizationId/:cardEvidenceId', function () {
        it('피감기관의 카드 거래 내역 증빙 자료를 삭제할 수 있다.', async function () {
            const cardEvidence = await model.CardEvidence.create({
                organizationId: organization.id,
                year: YEAR,
                half: HALF,
                key: KEY,
            });

            const res = await chai
                .request(app)
                .delete(
                    `/card_evidences/${organization.id}/${cardEvidence.id}`,
                );
            expect(res).to.have.status(200);
            const cardEvidences = await model.CardEvidence.findAll({
                where: {
                    id: cardEvidence.id,
                },
            });
            expect(cardEvidences.length).to.equal(0);
        });
    });
});
