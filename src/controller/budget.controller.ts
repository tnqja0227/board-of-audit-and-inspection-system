import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../service/budget.service';
import logger from '../config/winston';
import { BudgetRequestDto } from '../dto';

class BudgetController {
    private budgetService: BudgetService = new BudgetService();

    getTotal = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('BudgetController: getTotal called');

        const budgetRequestDto = this.getBudgetRequestDtoFromRequest(req);
        const total = await this.budgetService.getTotal(budgetRequestDto);
        res.json(total);
    };

    getIncomeBudget = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('BudgetController: getIncomeBudget called');

        const budgetRequestDto = this.getBudgetRequestDtoFromRequest(req);
        const incomeBudget =
            await this.budgetService.getIncomeBudget(budgetRequestDto);
        res.json(incomeBudget);
    };

    getExpenseBudget = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('BudgetController: getExpenseBudget called');

        const budgetRequestDto = this.getBudgetRequestDtoFromRequest(req);
        const expenseBudget =
            await this.budgetService.getExpenseBudget(budgetRequestDto);
        res.json(expenseBudget);
    };

    createBudget = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('BudgetController: createBudget called');

        const budgetRequestDto = this.getBudgetRequestDtoFromRequest(req);
        const manager = req.body.manager;
        const budget = await this.budgetService.createBudget(
            budgetRequestDto,
            manager, // TODO: get manager from session
        );
        res.json(budget);
    };

    deleteBudget = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('BudgetController: deleteBudget called');

        const budgetRequestDto = this.getBudgetRequestDtoFromRequest(req);
        await this.budgetService.deleteBudget(budgetRequestDto);
        res.sendStatus(200);
    };

    private getBudgetRequestDtoFromRequest = (req: Request) => {
        const organization_id = req.params.organization_id;
        const year = req.params.year;
        const half = req.params.half;
        const budgetRequestDto = new BudgetRequestDto(
            organization_id,
            year,
            half,
        );
        return budgetRequestDto;
    };
}

export { BudgetController };
