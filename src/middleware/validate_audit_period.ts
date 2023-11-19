import { Request, Response, NextFunction } from 'express';
import { AuditPeriod, Budget } from '../model';
import { sequelize } from '../db';
import { QueryTypes } from 'sequelize';
import {
    BadRequestError,
    NotFoundError,
    ValidationError,
} from '../utils/errors';

export async function validateAuditPeriodByYearAndHalf(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const year = req.params.year;
    const half = req.params.half;
    await findAuditPeriodAndValidate(year, half);
    next();
}

export async function validateAuditPeriodByBudgetId(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const budgetId = req.params.budget_id;
    const budget = await Budget.findByPk(budgetId);
    if (!budget) {
        throw new NotFoundError('예산이 존재하지 않습니다.');
    }

    const year = budget.year;
    const half = budget.half;
    await findAuditPeriodAndValidate(year, half);
    next();
}

export async function validateAuditPeriodFromBody(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const income_id = req.body.income_id;
    const expense_id = req.body.expense_id;

    if (!income_id && !expense_id) {
        throw new BadRequestError('income_id 혹은 expense_id가 필요합니다.');
    }

    if (income_id && expense_id) {
        throw new BadRequestError(
            'income_id와 expense_id는 동시에 사용할 수 없습니다.',
        );
    }

    if (income_id) {
        const { year, half } = await findYearAndHalfByIncomeId(income_id);
        await findAuditPeriodAndValidate(year, half);
    } else if (expense_id) {
        const { year, half } = await findYearAndHalfByExpenseId(expense_id);
        await findAuditPeriodAndValidate(year, half);
    }

    next();
}

export async function validateAuditPeriodByIncomeId(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const incomeId = req.params.income_id;
    const { year, half } = await findYearAndHalfByIncomeId(incomeId);
    await findAuditPeriodAndValidate(year, half);
    next();
}

export async function validateAuditPeriodByExpenseId(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const expenseId = req.params.expense_id;
    const { year, half } = await findYearAndHalfByExpenseId(expenseId);
    await findAuditPeriodAndValidate(year, half);
    next();
}

export async function findAuditPeriodAndValidate(
    year: string | number,
    half: string,
) {
    const auditPeriod = await AuditPeriod.findOne({
        where: {
            year: year,
            half: half,
        },
    });
    if (!auditPeriod) {
        throw new NotFoundError('감사기간이 존재하지 않습니다.');
    }

    const today = new Date();
    if (today < auditPeriod.start || today > auditPeriod.end) {
        throw new ValidationError('감사기간이 아닙니다.');
    }
}

export async function findYearAndHalfByIncomeId(incomeId: number | string) {
    const schema_name = process.env.NODE_ENV || 'development';
    const income_table = schema_name + '."incomes"';
    const budget_table = schema_name + '."budgets"';
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
        throw new NotFoundError('수입항목이 존재하지 않습니다.');
    }
    return {
        year: result[0]['year'],
        half: result[0]['half'],
    };
}

export async function findYearAndHalfByExpenseId(expenseId: number | string) {
    const schema_name = process.env.NODE_ENV || 'development';
    const expense_table = schema_name + '."expenses"';
    const budget_table = schema_name + '."budgets"';
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
        throw new NotFoundError('지출항목이 존재하지 않습니다.');
    }
    return {
        year: result[0]['year'],
        half: result[0]['half'],
    };
}
