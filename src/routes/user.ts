import express from 'express';
import bcrypt from 'bcrypt';
import { Organization, User } from '../model';

const saltRounds = 10;

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const users = await User.findAll();
        res.json(users.map((user) => user.toJSON()));
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
            return res.sendStatus(404);
        }

        let password = 'password';
        if (req.body.password !== undefined) {
            password = req.body.password;
        }
        const encrypted_password = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            email: req.body.email,
            password: encrypted_password,
            organization_id: organization.id,
        });
        res.json(user.toJSON());
    } catch (error) {
        next(error);
    }
});

// 로그인
// TODO: input sanitize
router.post('/login', async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: {
                email: req.body.email,
            },
        });
        if (user === null) {
            return res.sendStatus(404);
        }

        if (await bcrypt.compare(req.body.password, user.password)) {
            req.session.user = user.toJSON();
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
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

export const users = router;
