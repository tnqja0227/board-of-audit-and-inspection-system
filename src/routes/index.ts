import express from 'express';
import { createUsersRouter } from './user';
import { createOrganizationsRouter } from './organization';
import { createTransactionsRouter } from './transaction';
import { createTestRouter } from './test';
import { createAccountsRouter } from './account';
import { createBudgetsRouter } from './budget';
import { createExpenseRecordsRouter } from './expense_record';

export function createRouter() {
    const router = express.Router();
    router.use('/accounts', createAccountsRouter());
    router.use('/budgets', createBudgetsRouter());
    router.use('/organizations', createOrganizationsRouter());
    router.use('/transactions', createTransactionsRouter());
    router.use('/users', createUsersRouter());
    router.use('/test', createTestRouter());
    router.use('/expense_records', createExpenseRecordsRouter());

    return router;
}
