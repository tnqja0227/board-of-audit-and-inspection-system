import express from 'express';
import { validateOrganization } from '../middleware/auth';
import { wrapAsync } from '../middleware';
import { CardController } from '../controller';

export function createCardsRouter() {
    const router = express.Router();
    const cardController = new CardController();

    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(cardController.findAll),
    );

    router.post(
        '/:organization_id/:year/:half',
        wrapAsync(cardController.create),
    );

    router.put('/:card_id', wrapAsync(cardController.update));

    router.delete('/:card_id', wrapAsync(cardController.delete));

    return router;
}
