// 지출내역증빙서류

import express from 'express';
import multer from 'multer';
import { uploadFile } from '../s3';
import { validateOrganization } from '../middleware';

const allowedExtensions = ['jpg', 'jpeg', 'png'];

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const extension = file.originalname.split('.').pop()!.toLowerCase();
        if (allowedExtensions.includes(extension)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 2,
    },
});

const router = express.Router();

// TODO : set filename with user's information or validation
router.post(
    '/image/:organization_name/:year/:semester',
    validateOrganization,
    upload.array('image', 10),
    async (req, res, next) => {
        try {
            const files = req.files as Express.Multer.File[];

            for (const [index, element] of files.entries()) {
                const filename = `${req.params.organization_name}/${
                    req.params.year
                }/${req.params.semester}/${index}.${element.originalname
                    .split('.')
                    .pop()!
                    .toLowerCase()}`;
                const file = element.buffer;
                await uploadFile(filename, file);
            }
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    },
);

export const documents = router;
