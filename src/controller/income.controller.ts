import { Request, Response, NextFunction } from 'express';
import { IncomeService } from '../service';
import logger from '../config/winston';
import { CreateIncomeDto, DeleteIncomeDto, UpdateIncomeDto } from '../dto';

class IncomeController {
    private incomeService: IncomeService = new IncomeService();

    createIncome = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('IncomeController: createIncome called');

        const budgetId = req.params.budgetId;
        const code = req.body.code;
        const source = req.body.source;
        const category = req.body.category;
        const content = req.body.content;
        const amount = req.body.amount;
        const note = req.body.note;
        const dto = new CreateIncomeDto(
            budgetId,
            code,
            source,
            category,
            content,
            amount,
            note,
        );
        const income = await this.incomeService.createIncome(dto);
        res.json(income);
    };

    updateIncome = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('IncomeController: updateIncome called');

        const incomeId = req.params.income_id;
        const source = req.body.source;
        const category = req.body.category;
        const content = req.body.content;
        const amount = req.body.amount;
        const note = req.body.note;
        const dto = new UpdateIncomeDto(
            incomeId,
            source,
            category,
            content,
            amount,
            note,
        );
        await this.incomeService.updateIncome(dto);
        res.sendStatus(200);
    };

    deleteIncome = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('IncomeController: deleteIncome called');

        const incomeId = req.params.income_id;
        const dto = new DeleteIncomeDto(incomeId);
        await this.incomeService.deleteIncome(dto);
        res.sendStatus(200);
    };
}

export { IncomeController };
