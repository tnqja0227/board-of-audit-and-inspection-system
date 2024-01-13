import express from 'express';
import { validateAuditPeriod, wrapAsync } from '../middleware';
import { validateOrganization } from '../middleware/auth';
import { TransactionController } from '../controller';

export function createTransactionsRouter() {
    const router = express.Router();
    const transactionController = new TransactionController();

    router.use(wrapAsync(validateOrganization));

    router.get(
        '/:organization_id/:year/:half',
        wrapAsync(transactionController.getTransactions),
    );

    router.use(wrapAsync(validateAuditPeriod));

    router.post('/', wrapAsync(transactionController.createTransaction));

    router.delete(
        '/:transaction_id',
        wrapAsync(transactionController.deleteTransaction),
    );

    router.put(
        '/:transaction_id',
        wrapAsync(transactionController.updateTransaction),
    );

    return router;
}
