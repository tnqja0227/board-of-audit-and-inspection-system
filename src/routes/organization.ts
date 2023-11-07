import express from 'express';
import { Organization } from '../model';

const router = express.Router();

router.get('/', async (req, res, next) => {
    /*
    모든 피감기구 목록
    권한: admin
    */
    try {
        const organizations = await Organization.findAll();
        res.json(organizations.map((organization) => organization.toJSON()));
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    /*
    피감기구 추가
    권한: admin
    */
    try {
        const organization = await Organization.create({
            name: req.body.name,
        });
        res.json(organization.toJSON());
    } catch (error) {
        next(error);
    }
});

export const organizations = router;
