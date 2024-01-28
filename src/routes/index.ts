import express from 'express';
import { createUsersRouter } from './user';
import { createOrganizationsRouter } from './organization';
import { createTransactionsRouter } from './transaction';
import { createTestRouter } from './test';
import { createAccountsRouter } from './account';
import { createBudgetsRouter } from './budget';
import { createTransactionRecordsRouter } from './transaction_record';
import { createCardEvidenceRouter } from './card_evidence';
import { createAccountRecordRouter } from './account_record';

export function createRouter() {
    const router = express.Router();
    router.use('/accounts', createAccountsRouter());
    router.use('/budgets', createBudgetsRouter());
    router.use('/organizations', createOrganizationsRouter());
    router.use('/transactions', createTransactionsRouter());
    router.use('/users', createUsersRouter());
    router.use('/test', createTestRouter());
    router.use('/transaction_records', createTransactionRecordsRouter());
    router.use('/card_evidences', createCardEvidenceRouter());
    router.use('/account_records', createAccountRecordRouter());
    return router;
}
