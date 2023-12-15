import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { wrapAsync } from '../middleware';
import logger from '../config/winston';
import * as model from '../model';
import { sequelize } from '../db';

export function createTestRouter() {
    const router = express.Router();

    router.get('/', (req: Request, res: Response, next: NextFunction) => {
        res.send('Hello World!');
    });

    router.use(function (req, res, next) {
        if (process.env.NODE_ENV === 'production') {
            logger.error('Cannot create dummy data in production');
            return res.sendStatus(400);
        }
        next();
    });

    //! it clears all data in database before creating dummy data
    router.post(
        '/dummy',
        wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
            logger.info('Create dummy data');

            await sequelize.truncate({ cascade: true });

            const account1 = {
                accountNumber: '1234567890',
                accountBank: '우리은행',
                accountOwner: '김넙죽',
            };
            const account2 = {
                accountNumber: '9876543210',
                accountBank: '우리은행',
                accountOwner: '이넙죽',
            };

            const organization = await model.Organization.create({
                name: '감사원',
            });
            const budget = await model.Budget.create({
                year: 2023,
                half: 'spring',
                manager: '김넙죽',
                OrganizationId: organization.id,
            });
            const budget_id = budget.id;

            const income101 = await model.Income.create({
                BudgetId: budget_id,
                code: '101',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계 지원금',
                amount: 180000,
            });
            await model.Transaction.create({
                projectAt: new Date('2023-03-01'),
                manager: '김넙죽',
                content: '중앙회계 지원금',
                amount: 180000,
                balance: 180000,
                transactionAt: new Date('2023-03-01'),
                IncomeId: income101.id,
                ...account1,
            });

            const income102 = await model.Income.create({
                BudgetId: budget_id,
                code: '102',
                source: '학생회비',
                category: '중앙회계',
                content: '중앙회계 이월금',
                amount: 632238,
            });
            await model.Transaction.create({
                projectAt: new Date('2023-03-01'),
                manager: '김넙죽',
                content: '중앙회계 이월금',
                amount: 502690,
                balance: 682690,
                transactionAt: new Date('2023-03-01'),
                IncomeId: income102.id,
                ...account1,
            });

            const income103 = await model.Income.create({
                BudgetId: budget_id,
                code: '103',
                source: '학생회비',
                category: '격려기금',
                content: '격려금',
                amount: 1543856,
            });
            await model.Transaction.create({
                projectAt: new Date('2023-03-15'),
                manager: '김넙죽',
                content: '격려금',
                amount: 186441,
                balance: 869131,
                transactionAt: new Date('2023-03-15'),
                IncomeId: income103.id,
                ...account1,
            });

            const income301 = await model.Income.create({
                BudgetId: budget_id,
                code: '301',
                source: '자치',
                category: '예금이자',
                content: '예금이자',
                amount: 2000,
            });
            await model.Transaction.create({
                projectAt: new Date('2023-03-01'),
                manager: '김넙죽',
                content: '예금이자',
                amount: 261,
                balance: 261,
                transactionAt: new Date('2023-05-01'),
                IncomeId: income301.id,
                ...account2,
            });

            const expense401 = await model.Expense.create({
                BudgetId: budget_id,
                code: '401',
                source: '학생회비',
                category: '운영비',
                project: '격려기금',
                content: '격려금',
                amount: 1543856,
            });
            await model.Transaction.create({
                projectAt: new Date('2023-05-30'),
                manager: '김넙죽',
                content: '격려금',
                amount: 186441,
                balance: 682690,
                transactionAt: new Date('2023-05-30'),
                ExpenseId: expense401.id,
                ...account1,
            });

            const expense402 = await model.Expense.create({
                BudgetId: budget_id,
                code: '402',
                source: '학생회비',
                category: '정기사업비',
                project: '감사원 LT',
                content: '복리후생비',
                amount: 120000,
            });

            const expense403 = await model.Expense.create({
                BudgetId: budget_id,
                code: '403',
                source: '학생회비',
                category: '회의비',
                project: '감사원 회의',
                content: '회의비',
                amount: 120000,
                note: '내부 문제로 LT 사업 진행하지 않아 미집행',
            });

            const expense404 = await model.Expense.create({
                BudgetId: budget_id,
                code: '404',
                source: '학생회비',
                category: '비정기사업비',
                project: '사무소모품 및 유지',
                content: '복리후생비',
                amount: 60000,
            });
            await model.Transaction.create({
                projectAt: new Date('2023-05-30'),
                manager: '김넙죽',
                content: '복리후생비',
                amount: 61370,
                balance: 621320,
                transactionAt: new Date('2023-05-30'),
                ExpenseId: expense404.id,
                ...account1,
            });

            res.json({
                organizationId: organization.id,
                budgetId: budget.id,
                income101Id: income101.id,
                income102Id: income102.id,
                income103Id: income103.id,
                income301Id: income301.id,
                expense401Id: expense401.id,
                expense402Id: expense402.id,
                expense403Id: expense403.id,
                expense404Id: expense404.id,
            });
        }),
    );

    return router;
}
