// 피감기구

import express from 'express';
import * as db from '../db';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const organizations = await db.query('SELECT * FROM organization', []);
        res.json(organizations);
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
        await db.query('ALTER TABLE organization RENAME COLUMN ($1) TO ($2);', [
            req.body.from,
            req.body.to,
        ]);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const organizations = router;
