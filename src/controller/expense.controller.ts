import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../service';
import logger from '../config/winston';
import { CreateExpenseDto, DeleteExpenseDto, UpdateExpenseDto } from '../dto';

class ExpenseController {
    private expenseService: ExpenseService = new ExpenseService();

    createExpense = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('ExpenseController: createExpense called');

        const budgetId = req.params.budgetId;
        const code = req.body.code;
        const source = req.body.source;
        const category = req.body.category;
        const project = req.body.project;
        const content = req.body.content;
        const amount = req.body.amount;
        const note = req.body.note;
        const dto = new CreateExpenseDto(
            budgetId,
            code,
            source,
            category,
            project,
            content,
            amount,
            note,
        );
        const expense = await this.expenseService.createExpense(dto);
        res.json(expense);
    };

    updateExpense = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('ExpenseController: updateExpense called');

        const expenseId = req.params.expenseId;
        const source = req.body.source;
        const category = req.body.category;
        const project = req.body.project;
        const content = req.body.content;
        const amount = req.body.amount;
        const note = req.body.note;
        const dto = new UpdateExpenseDto(
            expenseId,
            source,
            category,
            project,
            content,
            amount,
            note,
        );
        await this.expenseService.updateExpense(dto);
        res.sendStatus(200);
    };

    deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('ExpenseController: deleteExpense called');

        const expenseId = req.params.expenseId;
        const dto = new DeleteExpenseDto(expenseId);
        await this.expenseService.deleteExpense(dto);
        res.sendStatus(200);
    };
}

export { ExpenseController };
