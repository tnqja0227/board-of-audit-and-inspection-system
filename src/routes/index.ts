import express from 'express';
import { createUsersRouter } from './user';
import { createOrganizationsRouter } from './organization';
import { createTransactionsRouter } from './transaction';
import { createTestRouter } from './test';
import { createAccountsRouter } from './account';
import { createBudgetsRouter } from './budget';
import { createCardsRouter } from './card';

export function createRouter() {
    const router = express.Router();
    router.use('/accounts', createAccountsRouter());
    router.use('/budgets', createBudgetsRouter());
    router.use('/cards', createCardsRouter());
    router.use('/organizations', createOrganizationsRouter());
    router.use('/transactions', createTransactionsRouter());
    router.use('/users', createUsersRouter());
    router.use('/test', createTestRouter());

    return router;
}
