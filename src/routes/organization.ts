// 피감기구

import express from 'express';
import * as db from '../db';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const organizations = await db.query('SELECT * FROM organization', []);
        res.json(organizations.rows);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        await db.query(
            'INSERT INTO organization (organization_name) VALUES ($1)',
            [req.body.organization_name],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.delete('/', async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM organization WHERE organization_name = ($1)',
            [req.body.organization_name],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

router.put('/', async (req, res, next) => {
    try {
        const result = await db.query(
            'UPDATE organization SET organization_name = ($1) WHERE organization_name = ($2);',
            [req.body.to, req.body.from],
        );
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const organizations = router;
