// 피감기구

import express from 'express';
import { Organization } from '../model';
import { validateIsAdmin } from '../middleware';
const router = express.Router();

router.get('/', validateIsAdmin, async (req, res, next) => {
    try {
        const organizations = await Organization.findAll();
        res.json(organizations.map((organization) => organization.toJSON()));
    } catch (error) {
        next(error);
    }
});

router.post('/', validateIsAdmin,async (req, res, next) => {
    try {
        const organization = await Organization.create({
            name: req.body.name,
        });
        res.json(organization.toJSON());
    } catch (error) {
        next(error);
    }
});

router.delete('/', validateIsAdmin,async (req, res, next) => {
    try {
        await Organization.destroy({
            where: {
                name: req.body.name,
            },
        });
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

export const organizations = router;
