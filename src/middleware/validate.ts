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
            return res.status(404).send('감사기간이 존재하지 않습니다.');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('감사기간이 아닙니다.');
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
            return res.status(404).send('잘못된 예산입니다.');
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
            return res.status(404).send('감사기간이 존재하지 않습니다.');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('감사기간이 아닙니다.');
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
            return res.status(404).send('수입항목이 존재하지 않습니다.');
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
            return res.status(404).send('감사기간이 존재하지 않습니다.');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('감사기간이 아닙니다.');
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
            return res.status(404).send('지출항목이 존재하지 않습니다.');
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
            return res.status(404).send('감사기간이 존재하지 않습니다.');
        }

        const today = new Date();
        if (today < auditPeriod.start || today > auditPeriod.end) {
            return res.status(403).send('감사기간이 아닙니다.');
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
