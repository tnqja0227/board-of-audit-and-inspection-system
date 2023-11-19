import logger from '../config/winston';
import { sequelize } from '../db';
import { User } from '../model';
import { QueryTypes } from 'sequelize';

export async function findAllUsersByOrganization() {
    const schema_name = process.env.NODE_ENV || 'development';
    const organization_schema = schema_name + '."organizations"';
    const user_schema = schema_name + '."users"';
    return await sequelize.query(
        `SELECT U."id", U."email", O."name" organization_name, U."role", U."cardNumber", U."cardBank", U."cardOwner", U."bankbook", U."isDisabled"
            FROM ${organization_schema} as O
                INNER JOIN ${user_schema} as U
                ON O.id = U."OrganizationId"
            ORDER BY O."name"`,
        {
            type: QueryTypes.SELECT,
        },
    );
}

export function checkPasswordCondition(password: string) {
    if (password.length < 8 || password.length > 12) {
        return false;
    }
    return true;
}

export async function findByEmail(email: string) {
    logger.info(`find user by email: ${email}`);

    const user = await User.findOne({
        where: {
            email,
        },
    });
    return user;
}

export async function findByOrganizationId(organization_id: string | number) {
    logger.info(`find user by organization_id: ${organization_id}`);

    const user = await User.findOne({
        where: {
            OrganizationId: organization_id,
        },
    });
    return user;
}
