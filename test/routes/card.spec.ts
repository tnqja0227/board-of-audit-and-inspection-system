import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as auth from '../../src/middleware/auth';
import * as model from '../../src/model';
import { initDB } from '../../src/db/utils';
import { createApp } from '../../src/app';

chai.use(chaiHttp);

const ORGANIZATION_NAME = '감사원';
const YEAR = 2023;
const HALF = 'spring';

describe('API /cards', function () {
    let app: Express.Application;
    var stubValidateOrganization: sinon.SinonStub;
    let organization: model.Organization;

    before(async function () {
        this.timeout(10000);
        await initDB();

        stubValidateOrganization = sinon
            .stub(auth, 'validateOrganization')
            .callsFake(async (req, res, next) => {
                return next();
            });
        app = createApp();
    });

    after(function () {
        stubValidateOrganization.restore();
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
        await model.Card.destroy(options);
    });

    describe('GET /:organization_id/:year/:half', function () {
        it('피감기관 별로 카드 목록을 확인할 수 있다.', async function () {
            const cardNumber = '1234567890';

            await model.Card.create({
                year: YEAR,
                half: HALF,
                cardNumber: cardNumber,
                OrganizationId: organization.id,
            });

            const res = await chai
                .request(app)
                .get(`/cards/${organization.id}/${YEAR}/${HALF}`);

            expect(res.status).to.equal(200);
            expect(res.body[0].cardNumber).to.equal(cardNumber);
        });
    });

    describe('POST /:organization_id/:year/:half', function () {
        it('피감기관 별로 카드를 추가할 수 있다.', async function () {
            const cardNumber = '1234567890';

            const res = await chai
                .request(app)
                .post(`/cards/${organization.id}/${YEAR}/${HALF}`)
                .send({
                    cardNumber: cardNumber,
                });

            expect(res.status).to.equal(200);
            expect(res.body.cardNumber).to.equal(cardNumber);
        });
    });

    describe('PUT /:card_id', function () {
        it('카드 정보를 수정할 수 있다.', async function () {
            const cardNumber = '1234567890';
            const newCardNumber = '0987654321';

            const card = await model.Card.create({
                year: YEAR,
                half: HALF,
                cardNumber: cardNumber,
                OrganizationId: organization.id,
            });

            const res = await chai.request(app).put(`/cards/${card.id}`).send({
                cardNumber: newCardNumber,
            });

            expect(res.status).to.equal(200);

            const updatedCard = await model.Card.findOne({
                where: {
                    id: card.id,
                },
            });
            expect(updatedCard!.cardNumber).to.equal(newCardNumber);
        });
    });

    describe('DELETE /:card_id', function () {
        it('카드를 삭제할 수 있다.', async function () {
            const cardNumber = '1234567890';

            const card = await model.Card.create({
                year: YEAR,
                half: HALF,
                cardNumber: cardNumber,
                OrganizationId: organization.id,
            });

            const res = await chai.request(app).delete(`/cards/${card.id}`);

            expect(res.status).to.equal(200);

            const deletedCard = await model.Card.findOne({
                where: {
                    id: card.id,
                },
            });
            expect(deletedCard).to.equal(null);
        });
    });
});
