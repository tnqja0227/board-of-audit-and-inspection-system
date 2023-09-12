import express from 'express';
import * as db from '../db';
import bcrypt from 'bcrypt';

const saltRounds = 10;

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const users = await db.query('SELECT * FROM users', []);
        res.json(users.rows);
    } catch (error) {
        next(error);
    }
});

// 계정 생성 (default password: password)
// TODO: admin 계정만 가능하도록 수정
// TODO: email sanitize (kaist email만 가능하도록)
router.post('/', async (req, res, next) => {
    try {
        const organization = await db.query(
            'SELECT organization_id FROM organization WHERE organization_name = ($1)',
            [req.body.organization_name],
        );
        const organization_id = organization.rows[0].organization_id;

        let password = 'password';
        if (req.body.password !== undefined) {
            password = req.body.password;
        }
        const encrypted_password = await bcrypt.hash(password, saltRounds);

        await db.query(
            'INSERT INTO users (email, password, organization_id) \
                VALUES ($1, $2, $3)',
            [req.body.email, encrypted_password, organization_id],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// 로그인
// TODO: input sanitize
router.post('/login', async (req, res, next) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE email = ($1)', [
            req.body.email,
        ]);

        if (user.rows.length === 0) {
            res.sendStatus(404);
        } else {
            if (
                await bcrypt.compare(req.body.password, user.rows[0].password)
            ) {
                req.session.user = user.rows[0];
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        }
    } catch (error) {
        next(error);
    }
});

export const users = router;
