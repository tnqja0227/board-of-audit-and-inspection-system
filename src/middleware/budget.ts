import { Request, Response, NextFunction } from 'express';
import * as errors from '../utils/errors';
import logger from '../config/winston';

export function validateCode(req: Request, res: Response, next: NextFunction) {
    const url = req.baseUrl;
    if (!url.includes('income') && !url.includes('expense')) {
        logger.debug(`${url} does not include 'income' or 'expense'`);
        throw new errors.BadRequestError('올바르지 않은 요청입니다.');
    }

    const code = req.body.code;
    const source = req.body.source;

    if (!code) throw new errors.BadRequestError('코드가 없습니다.');
    if (code.length !== 3)
        throw new errors.BadRequestError('코드는 3자리여야 합니다.');

    const is_income = url.includes('income') ? true : false;
    if (!isValidCode(code, source, is_income)) {
        throw new errors.BadRequestError('올바르지 않은 코드입니다.');
    }
    logger.debug(`code: ${code} is validated`);
    next();
}

function isValidCode(code: string, source: string, is_income: boolean) {
    if (is_income) {
        if (source === '학생회비' && code[0] !== '1') {
            return false;
        } else if (source === '본회계' && code[0] !== '2') {
            return false;
        } else if (source === '자치' && code[0] !== '3') {
            return false;
        }
    } else {
        if (source === '학생회비' && code[0] !== '4') {
            return false;
        } else if (source === '본회계' && code[0] !== '5') {
            return false;
        } else if (source === '자치' && code[0] !== '6') {
            return false;
        }
    }
    return true;
}
