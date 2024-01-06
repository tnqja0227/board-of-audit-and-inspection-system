import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../service';
import logger from '../config/winston';
import {
    CreateTransactionDto,
    GetTransactionDto,
    UpdateTransactionDto,
} from '../dto';

class TransactionController {
    private transactionService: TransactionService = new TransactionService();

    getTransactions = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('TransactionController: getTransactions called');

        const dto = new GetTransactionDto(
            req.params.organization_id,
            req.params.year,
            req.params.half,
        );
        const transactions =
            await this.transactionService.getFormattedTransactions(dto);
        res.json(transactions);
    };

    createTransaction = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('TransactionController: createTransaction called');

        const dto = new CreateTransactionDto(
            req.body.project_at,
            req.body.manager,
            req.body.content,
            req.body.type,
            req.body.amount,
            req.body.transaction_at,
            req.body.account_number,
            req.body.account_bank,
            req.body.account_owner,
            req.body.receiving_account_number,
            req.body.receiving_account_bank,
            req.body.receiving_account_owner,
            req.body.has_bill,
            req.body.note,
            req.body.income_id,
            req.body.expense_id,
        );
        const transaction = await this.transactionService.create(dto);
        res.json(transaction);
    };

    updateTransaction = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('TransactionController: updateTransaction called');

        const dto = new UpdateTransactionDto(
            req.params.transaction_id,
            req.body.project_at,
            req.body.manager,
            req.body.content,
            req.body.type,
            req.body.amount,
            req.body.transaction_at,
            req.body.account_number,
            req.body.account_bank,
            req.body.account_owner,
            req.body.receiving_account_number,
            req.body.receiving_account_bank,
            req.body.receiving_account_owner,
            req.body.has_bill,
            req.body.note,
            req.body.income_id,
            req.body.expense_id,
        );
        await this.transactionService.update(dto);
        res.sendStatus(200);
    };

    deleteTransaction = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('TransactionController: deleteTransaction called');

        const transactionId = req.params.transaction_id;
        await this.transactionService.delete(transactionId);
        res.sendStatus(200);
    };
}

export { TransactionController };
