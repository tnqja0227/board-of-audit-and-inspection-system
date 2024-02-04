import { Request, Response, NextFunction } from 'express';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import logger from '../config/winston';
import { Budget, CardRecord, Expense, Income } from '../model';

const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';

function checkSessionAndRole(
    req: Request,
    roleCheck: (role: string) => boolean,
) {
    if (!req.session.user) {
        logger.debug('Request does not have a session');
        throw new UnauthorizedError('로그인이 필요합니다.');
    }

    const role = req.session.user.role;
    if (!roleCheck(role)) {
        logger.debug(`${req.session.user.id} does not have the required role`);
        throw new UnauthorizedError('권한이 없습니다.');
    }
}

export async function validateIsAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    checkSessionAndRole(req, (role) => role === ROLE_ADMIN);
    logger.info(`User ${req.session.user!.id} is validated as admin`);
    next();
}

export async function validateOrganization(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    checkSessionAndRole(
        req,
        (role) => role === ROLE_ADMIN || role === ROLE_USER,
    );

    // if user is admin, skip the rest of the validation
    if (req.session.user!.role === ROLE_ADMIN) return next();

    const organizationId = req.session.user!.OrganizationId;
    const requestedOrganizationId = await findRequestedOrganization(req);
    if (organizationId != requestedOrganizationId) {
        logger.debug(
            `User ${
                req.session.user!.id
            } belongs to organization ${organizationId} and does not have permission to access organization ${requestedOrganizationId}`,
        );
        throw new UnauthorizedError('권한이 없습니다.');
    }

    logger.info(
        `User ${
            req.session.user!.id
        } is validated to access organization ${requestedOrganizationId}`,
    );
    next();
}

// Request에서 OrganizationId를 찾아 반환한다.
export async function findRequestedOrganization(req: Request) {
    if (req.params.organization_id) {
        return Promise.resolve(req.params.organization_id);
    } else if (req.params.budget_id) {
        return findOrganizationByBudgetId(req.params.budget_id);
    } else if (req.params.income_id) {
        return findOrganizationByIncomeId(req.params.income_id);
    } else if (req.body.income_id) {
        return findOrganizationByIncomeId(req.body.income_id);
    } else if (req.params.expense_id) {
        return findOrganizationByExpenseId(req.params.expense_id);
    } else if (req.body.expense_id) {
        return findOrganizationByExpenseId(req.body.expense_id);
    } else if (req.params.card_evidence_id) {
        return findOrganizationByCardRecordID(req.params.card_record_id);
    }

    logger.debug('Cannot find OrganizationId in request');
    throw new NotFoundError('요청에서 OrganizationId를 찾을 수 없습니다.');
}

async function findOrganizationByBudgetId(budget_id: string | number) {
    const budget = await Budget.findByPk(budget_id);
    if (!budget) {
        logger.debug(`Budget ID ${budget_id} is not found}`);
        throw new NotFoundError('예산 ID가 존재하지 않습니다.');
    }
    logger.info(`Organization ${budget.OrganizationId} is found`);
    return Promise.resolve(budget.OrganizationId);
}

async function findOrganizationByIncomeId(income_id: string | number) {
    const income = await Income.findByPk(income_id);
    if (!income) {
        logger.debug(`Income ID ${income_id} is not found}`);
        throw new NotFoundError('수입 ID가 존재하지 않습니다.');
    }
    return findOrganizationByBudgetId(income.BudgetId);
}

async function findOrganizationByExpenseId(expense_id: string | number) {
    const expense = await Expense.findByPk(expense_id);
    if (!expense) {
        logger.debug(`Expense ID ${expense_id} is not found}`);
        throw new NotFoundError('지출 ID가 존재하지 않습니다.');
    }
    return findOrganizationByBudgetId(expense.BudgetId);
}

async function findOrganizationByCardRecordID(
    card_evidence_id: string | number,
) {
    const cardRecord = await CardRecord.findByPk(card_evidence_id);
    if (!cardRecord) {
        logger.debug(`CardRecord ID ${card_evidence_id} is not found}`);
        throw new NotFoundError('카드 증빙 자료 ID가 존재하지 않습니다.');
    }
    return Promise.resolve(cardRecord.OrganizationId);
}
