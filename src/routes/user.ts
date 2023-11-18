import express from 'express';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../model';
import { wrapAsync } from '../middleware';
import * as OrganizationService from '../service/organization';
import * as UserService from '../service/user';
import {
    DuplicateError,
    UnauthorizedError,
    BadRequestError,
} from '../utils/errors';
import errorHandler from '../middleware/error_handler';

const saltRounds = 10;

const usersRouter = express.Router();

// TODO: admin
usersRouter.get(
    '/',
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const users = await UserService.findAllUsersByOrganization();
        res.json(users);
    }),
);

// 계정 생성 (default password: password)
// TODO: email sanitize (kaist email만 가능하도록)
usersRouter.post(
    '/',
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const organization = await OrganizationService.findByName(
            req.body.organization_name,
        );

        const user_with_duplicated_organization =
            await UserService.findByOrganizationId(organization.id);
        if (user_with_duplicated_organization) {
            throw new DuplicateError(
                '이미 등록된 피감기구의 계정이 존재합니다.',
            );
        }

        const user_with_duplicated_email = await UserService.findByEmail(
            req.body.email,
        );
        if (user_with_duplicated_email) {
            throw new DuplicateError('이미 등록된 이메일이 존재합니다.');
        }

        const initial_password = 'password';
        const encrypted_password = await bcrypt.hash(
            initial_password,
            saltRounds,
        );

        const user = await User.create({
            email: req.body.email,
            password: encrypted_password,
            cardNumber: req.body.card_number,
            cardBank: req.body.card_bank,
            cardOwner: req.body.card_owner,
            bankbook: req.body.bankbook,
            OrganizationId: organization.id,
            isDisabled: req.body.is_disabled,
        });
        res.json(user.toJSON());
    }),
);

// 로그인
usersRouter.post(
    '/login',
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const user = await UserService.findByEmail(req.body.email);
        if (!user) {
            throw new UnauthorizedError(
                '아이디 혹은 비밀번호가 일치하지 않습니다.',
            );
        }

        if (!(await bcrypt.compare(req.body.password, user.password))) {
            throw new UnauthorizedError(
                '아이디 혹은 비밀번호가 일치하지 않습니다.',
            );
        }
        req.session.user = user.toJSON();
        res.sendStatus(200);
    }),
);

// 비밀번호 변경
usersRouter.post(
    '/password',
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const user = await UserService.findByEmail(req.body.email);
        if (!user) {
            throw new UnauthorizedError(
                '아이디 혹은 비밀번호가 일치하지 않습니다.',
            );
        }

        const password = req.body.password;
        if (!UserService.checkPasswordCondition(password)) {
            throw new BadRequestError(
                '비밀번호는 8자 이상 12자 이하여야 합니다.',
            );
        }

        const new_password = req.body.new_password;
        const encrypted_password = await bcrypt.hash(new_password, saltRounds);
        user.password = encrypted_password;
        await user.save();
        res.sendStatus(200);
    }),
);

// TODO: admin
// 계정 비활성화
usersRouter.put(
    '/disable',
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const user = await UserService.findByEmail(req.body.email);
        if (!user) {
            throw new UnauthorizedError(
                '아이디 혹은 비밀번호가 일치하지 않습니다.',
            );
        }

        user.isDisabled = true;
        await user.save();
        res.sendStatus(200);
    }),
);

// TODO: admin
// 계정 활성화
usersRouter.put(
    '/enable',
    wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
        const user = await UserService.findByEmail(req.body.email);
        if (!user) {
            throw new UnauthorizedError(
                '아이디 혹은 비밀번호가 일치하지 않습니다.',
            );
        }

        user.isDisabled = false;
        await user.save();
        res.sendStatus(200);
    }),
);

usersRouter.use(errorHandler);

export default usersRouter;
