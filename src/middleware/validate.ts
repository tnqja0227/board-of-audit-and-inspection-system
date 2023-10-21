import { Request, Response, NextFunction } from 'express';
import { AuditPeriod, Budget } from '../model';
import { sequelize } from '../db';
import { QueryTypes } from 'sequelize';

export async function validateAuditPeriodByYearAndHalf(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const year = req.params.year;
        const half = req.params.half;
        const auditPeriod = await AuditPeriod.findOne({
            where: {
                year: year,
                half: half,
            },
        });
        if (!auditPeriod) {
            return res.status(404).send('Audit period not found');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('Not in audit period');
        }
        next();
    } catch (error) {
        next(error);
    }
}

export async function validateAuditPeriodByBudgetId(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const budgetId = req.params.budget_id;
        const budget = await Budget.findByPk(budgetId);
        if (!budget) {
            return res.status(404).send('Budget not found');
        }

        const year = budget.year;
        const half = budget.half;
        const auditPeriod = await AuditPeriod.findOne({
            where: {
                year: year,
                half: half,
            },
        });
        if (!auditPeriod) {
            return res.status(404).send('Audit period not found');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('Not in audit period');
        }
        next();
    } catch (error) {
        next(error);
    }
}

export async function validateAuditPeriodByIncomeId(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const schema_name = process.env.NODE_ENV || 'development';
        const income_table = schema_name + '."incomes"';
        const budget_table = schema_name + '."budgets"';
        const incomeId = req.params.income_id;
        const result: { year: number; half: string }[] = await sequelize.query(
            `SELECT B."year" AS year, B."half" AS half
            FROM ${income_table} AS I
                INNER JOIN ${budget_table} AS B
                ON I."BudgetId" = B.id
            WHERE I.id = ${incomeId}`,
            {
                type: QueryTypes.SELECT,
            },
        );

        if (result.length === 0) {
            return res.status(404).send('Income not found');
        }

        const year = result[0]['year'];
        const half = result[0]['half'];
        const auditPeriod = await AuditPeriod.findOne({
            where: {
                year: year,
                half: half,
            },
        });
        if (!auditPeriod) {
            return res.status(404).send('Audit period not found');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('Not in audit period');
        }
        next();
    } catch (error) {
        next(error);
    }
}

export async function validateAuditPeriodByExpenseId(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const schema_name = process.env.NODE_ENV || 'development';
        const expense_table = schema_name + '."expenses"';
        const budget_table = schema_name + '."budgets"';
        const expenseId = req.params.expense_id;
        const result: { year: number; half: string }[] = await sequelize.query(
            `SELECT B."year" AS year, B."half" AS half
            FROM ${expense_table} AS E
                INNER JOIN ${budget_table} AS B
                ON E."BudgetId" = B.id
            WHERE E.id = ${expenseId}`,
            {
                type: QueryTypes.SELECT,
            },
        );

        if (result.length === 0) {
            return res.status(404).send('Expense not found');
        }

        const year = result[0]['year'];
        const half = result[0]['half'];
        const auditPeriod = await AuditPeriod.findOne({
            where: {
                year: year,
                half: half,
            },
        });
        if (!auditPeriod) {
            return res.status(404).send('Audit period not found');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('Not in audit period');
        }
        next();
    } catch (error) {
        next(error);
    }
}

export async function validateIsAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const role = req.session.user!.role;
        if (role !== 'admin') {
            return res.status(403).send('Not admin');
        }
        next();
    } catch (error) {
        next(error);
    }
}
