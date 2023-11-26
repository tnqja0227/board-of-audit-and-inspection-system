import { Request, Response, NextFunction } from 'express';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import logger from '../config/winston';
import { Budget, Expense, Income } from '../model';

export async function validateIsAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!req.session.user) {
        logger.debug('Request does not have a session');
        throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const role = req.session.user.role;
    if (!isAdmin(role)) {
        logger.debug('Request does not have admin role');
        throw new UnauthorizedError('권한이 없습니다.');
    }
    logger.debug('Admin user is validated');
    next();
}

export async function validateOrganization(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!req.session.user) {
        logger.debug('Request does not have a session');
        throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const role = req.session.user.role;
    if (isAdmin(role)) {
        logger.debug('Authorization is passed because the user is admin');
        return next();
    }

    const organization = req.session.user.OrganizationId;
    if (!organization) {
        logger.debug('Request does not have a organization ID');
        throw new UnauthorizedError('권한이 없습니다.');
    }

    const requested_organization = await findRequestedOrganization(req);
    if (organization != requested_organization) {
        logger.debug('Request does not have a valid organization');
        throw new UnauthorizedError('권한이 없습니다.');
    }
    logger.debug('Organization is validated');
    next();
}

function isAdmin(role: string) {
    return role === 'admin';
}

// Request에서 OrganizationId를 찾아 반환한다.
export async function findRequestedOrganization(req: Request) {
    if (req.params.organization_id) {
        return req.params.organization_id;
    }

    if (req.params.budget_id) {
        return findOrganizationByBudgetId(req.params.budget_id);
    }

    if (req.params.income_id) {
        return findOrganizationByIncomeId(req.params.income_id);
    }

    if (req.params.expense_id) {
        return findOrganizationByExpenseId(req.params.expense_id);
    }

    throw new NotFoundError('요청에서 OrganizationId를 찾을 수 없습니다.');
}

async function findOrganizationByBudgetId(budget_id: string | number) {
    const budget = await Budget.findByPk(budget_id);
    if (!budget) {
        logger.debug(`Budget ID ${budget_id} is not found}`);
        throw new NotFoundError('예산 ID가 존재하지 않습니다.');
    }
    return budget.OrganizationId;
}

async function findOrganizationByIncomeId(income_id: string | number) {
    const income = await Income.findByPk(income_id);
    if (!income) {
        logger.debug(`Income ID ${income_id} is not found}`);
        throw new NotFoundError('수입 ID가 존재하지 않습니다.');
    }

    const budget_id = income.BudgetId;
    return await findOrganizationByBudgetId(budget_id);
}

async function findOrganizationByExpenseId(expense_id: string | number) {
    const expense = await Expense.findByPk(expense_id);
    if (!expense) {
        logger.debug(`Expense ID ${expense_id} is not found}`);
        throw new NotFoundError('지출 ID가 존재하지 않습니다.');
    }

    const budget_id = expense.BudgetId;
    return await findOrganizationByBudgetId(budget_id);
}
