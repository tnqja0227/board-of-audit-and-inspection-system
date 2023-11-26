import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { incomes } from './income';
import { expenses } from './expense';
import { periods } from './period';
import { Budget } from '../../model';
import { sequelize } from '../../db';
import { QueryTypes } from 'sequelize';
import { validateAuditPeriod } from '../../middleware/validate_audit_period';
import errorHandler from '../../middleware/error_handler';
import { wrapAsync } from '../../middleware';
import * as BudgetService from '../../service/budget';
import * as auth from '../../middleware/auth';

const budgetsRouter = express.Router();

budgetsRouter.use('/income', incomes);
budgetsRouter.use('/expense', expenses);
budgetsRouter.use('/period', periods);

// 피감기관의 예산안 목록
budgetsRouter.get(
    '/:organization_id/:year/:half',
    wrapAsync(auth.validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const organization_id = req.params.organization_id;
        const year = req.params.year;
        const half = req.params.half;
        const budget = await BudgetService.getBudgetResult(
            organization_id,
            year,
            half,
        );
        res.json(budget);
    }),
);

budgetsRouter.get(
    '/report/:organization_id/:year/:half',
    wrapAsync(auth.validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const organization_id = req.params.organization_id;
        const year = req.params.year;
        const half = req.params.half;
        const report = await BudgetService.getSettlementResult(
            organization_id,
            year,
            half,
        );
        res.json(report);
    }),
);

// prettier-ignore
budgetsRouter.get(
    '/report/expense/:organization_id/:year/:half',
    wrapAsync(auth.validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const schema_name = process.env.NODE_ENV || 'development';
        const expense_table = schema_name + '."expenses"';
        const budget_table = schema_name + '."budgets"';
        const transaction_table = schema_name + '."transactions"';
        const result = await sequelize.query(
            `WITH target_expenses AS (
                SELECT "id", "source", "category", "content", "project", "amount" budget, COALESCE("expense", 0) expense, COALESCE("expense", 0)::float / "amount"::float ratio, "note", "code"
                FROM ${expense_table} AS E
                    LEFT JOIN (
                        SELECT sum(amount) AS expense, "ExpenseId"
                        FROM ${transaction_table}
                        WHERE "ExpenseId" IS not NULL
                        GROUP BY "ExpenseId") AS T
                    ON E.id = T."ExpenseId"
                WHERE "BudgetId" IN (
                    SELECT id
                    FROM ${budget_table}
                    WHERE "OrganizationId" = ${req.params.organization_id}
                        AND "year" = '${req.params.year}' AND "half" = '${req.params.half}'
                )
            )
            
            SELECT "source", sum("budget") "예산 소계", sum("expense") "결산 소계", sum("expense")::float / sum("budget")::float "비율", 
                json_agg(jsonb_build_object('예산 분류', category, '항목', CONTENT, '사업', project, 
                '예산', budget, '결산', expense, '비율', ratio, '비고', note, '코드', code))
            FROM target_expenses
            GROUP BY "source"
            ORDER BY "source";`
            ,
            {
                type: QueryTypes.SELECT,
            },
        );
        res.json(result);
    })
);

budgetsRouter.get(
    '/report/total/:organization_id/:year/:half',
    wrapAsync(auth.validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const organization_id = req.params.organization_id;
        const year = req.params.year;
        const half = req.params.half;
        const result = await BudgetService.getTotalResult(
            organization_id,
            year,
            half,
        );
        res.json(result);
    }),
);

// 예산안 생성
budgetsRouter.post(
    '/:organization_id/:year/:half',
    wrapAsync(validateAuditPeriod),
    wrapAsync(auth.validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const budget = await Budget.create({
            OrganizationId: req.params.organization_id,
            year: req.params.year,
            half: req.params.half,
            manager: req.body.manager, // TODO: get manager from session
        });
        res.json(budget.toJSON());
    }),
);

// 예산안 삭제
budgetsRouter.delete(
    '/:organization_id/:year/:half',
    wrapAsync(validateAuditPeriod),
    wrapAsync(auth.validateOrganization),
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        await Budget.destroy({
            where: {
                OrganizationId: req.params.organization_id,
                year: req.params.year,
                half: req.params.half,
            },
        });
        res.sendStatus(200);
    }),
);

budgetsRouter.use(errorHandler);

export default budgetsRouter;
