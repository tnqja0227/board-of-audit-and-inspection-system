import { QueryTypes } from 'sequelize';
import { sequelize } from '../db';
import { schemaName } from '../utils/common';
import { CreateUserDto } from '../dto';
import { User } from '../model';

class UserRepository {
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
        return User.findOne({
            where: {
                email,
            },
        });
    }

    async findByOrganizationId(organizationId: string | number) {
        return User.findOne({
            where: {
                OrganizationId: organizationId,
            },
        });
    }

    async create(dto: CreateUserDto, organizationId: string | number) {
        return User.create({
            email: dto.email,
            password: dto.password,
            initialPassword: dto.initialPassword,
            OrganizationId: organizationId,
        });
    }
}

export { UserRepository };
