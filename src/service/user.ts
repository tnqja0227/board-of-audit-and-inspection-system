import logger from '../config/winston';
import { User } from '../model';
import {
    BadRequestError,
    DuplicateError,
    NotFoundError,
    UnauthorizedError,
} from '../utils/errors';
import { compare, hash } from 'bcrypt';

const SALT = 10;

export async function encrypt(password: string) {
    return hash(password, SALT);
}

export async function findByEmail(email: string) {
    const user = await User.findOne({
        where: {
            email,
        },
    });
    if (!user) {
        throw new NotFoundError(
            `이메일 ${email}에 대한 유저를 찾을 수 없습니다.`,
        );
    }
    return user;
}

export async function checkDuplicateUserByOrganizationID(
    organization_id: string | number,
) {
    const user = await User.findOne({
        where: {
            OrganizationId: organization_id,
        },
    });
    if (user) {
        throw new DuplicateError('이미 등록된 피감기구의 계정이 존재합니다.');
    }
    logger.info(
        `passed duplicate check by organization_id: ${organization_id}`,
    );
}

export async function checkDuplicateUserByEmail(email: string) {
    const user = await User.findOne({
        where: {
            email,
        },
    });
    if (user) {
        throw new DuplicateError('이미 등록된 이메일이 존재합니다.');
    }
    logger.info(`passed duplicate check by email: ${email}`);
}

export async function checkPassword(given: string, actual: string) {
    const match = await compare(given, actual);
    if (!match) {
        throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');
    }
    logger.info(`password matched`);
}

export function checkPasswordCondition(password: string) {
    if (password.length < 8 || password.length > 12) {
        throw new BadRequestError('비밀번호는 8자 이상 12자 이하여야 합니다.');
    }
}
