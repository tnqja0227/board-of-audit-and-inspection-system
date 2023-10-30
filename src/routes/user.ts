import express from 'express';
import bcrypt from 'bcrypt';
import { Organization, User } from '../model';
import { sequelize } from '../db';
import { QueryTypes } from 'sequelize';

const saltRounds = 10;

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const schema_name = process.env.NODE_ENV || 'development';
        const organization_schema = schema_name + '."organizations"';
        const user_schema = schema_name + '."users"';
        const users = await sequelize.query(
            `SELECT U."id", U."email", O."name" organization_name, U."cardNumber", U."cardBank", U."cardOwner", U."bankbook", U."isDisabled"
            FROM ${organization_schema} as O
                INNER JOIN ${user_schema} as U
                ON O.id = U."OrganizationId"
            ORDER BY O."name"`,
            {
                type: QueryTypes.SELECT,
            },
        );
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// 계정 생성 (default password: password)
// TODO: admin 계정만 가능하도록 수정
// TODO: email sanitize (kaist email만 가능하도록)
router.post('/', async (req, res, next) => {
    try {
        const organization = await Organization.findOne({
            where: {
                name: req.body.organization_name,
            },
        });

        if (organization === null) {
            return res.status(404).send('잘못된 피감기구입니다.');
        }

        // TODO: 초기 비밀번호 설정
        let password = 'password';
        if (req.body.password !== undefined) {
            password = req.body.password;
        }
        const encrypted_password = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            email: req.body.email,
            password: encrypted_password,
            cardNumber: req.body.card_number,
            cardBank: req.body.card_bank,
            cardOwner: req.body.card_owner,
            bankbook: req.body.bankbook,
            OrganizationId: organization.id,
            isDisabled: req.body.is_disabled,
            role: req.body.role, 
        });
        res.json(user.toJSON());
    } catch (error) {
        next(error);
    }
});

// 로그인
router.post('/login', async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: {
                email: req.body.email,
            },
        });
        if (user === null) {
            return res.status(404).send('존재하지 않는 계정입니다.');
        }

        if (!(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(401).send('비밀번호가 일치하지 않습니다.');
        }
        req.session.user = user.toJSON();
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// 비밀번호 변경
router.post('/password', async (req, res, next) => {
    try {
        await User.update(
            {
                password: req.body.password,
            },
            {
                where: {
                    email: req.body.email,
                },
            },
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// 계정 비활성화
router.put('/disable', async (req, res, next) => {
    try {
        await User.update(
            {
                isDisabled: true,
            },
            {
                where: {
                    email: req.body.email,
                },
            },
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// 계정 활성화
router.put('/enable', async (req, res, next) => {
    try {
        await User.update(
            {
                isDisabled: false,
            },
            {
                where: {
                    email: req.body.email,
                },
            },
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const users = router;
