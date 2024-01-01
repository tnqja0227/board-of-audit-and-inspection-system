import { QueryTypes } from 'sequelize';
import { sequelize } from '../db';
import { schemaName } from '../utils/common';
import { CreateUserDto } from '../dto';
import { User } from '../model';
import { NotFoundError } from '../utils/errors';
import { OrganizationRepository } from './organization.repository';

class UserRepository {
    private organizationRepository = new OrganizationRepository();

    //! password와 initialPassword가 노출되므로 주의
    async findAll() {
        return sequelize.query(
            `SELECT 
                U."id", 
                U."email", 
                O."name" organization_name,
                U."password",
                U."initialPassword",
                U."role",
                U."isDisabled"
            FROM ${schemaName}."organizations" as O
                INNER JOIN ${schemaName}."users" as U
                ON O.id = U."OrganizationId"
            ORDER BY O."name"`,
            {
                type: QueryTypes.SELECT,
            },
        );
    }

    async findByEmail(email: string) {
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

    async findByOrganizationId(organizationId: string | number) {
        const user = await User.findOne({
            where: {
                OrganizationId: organizationId,
            },
        });
        if (!user) {
            throw new NotFoundError(
                `피감기구 ${organizationId}에 대한 유저를 찾을 수 없습니다.`,
            );
        }
        return user;
    }

    async create(dto: CreateUserDto) {
        const organization = await this.organizationRepository.findByName(
            dto.organizationName,
        );
        return User.create({
            email: dto.email,
            password: dto.password,
            initialPassword: dto.initialPassword,
            OrganizationId: organization.id,
        });
    }
}

export { UserRepository };
