import logger from '../config/winston';
import { ChangePasswordDto, CreateUserDto, LoginDto } from '../dto';
import { OrganizationRepository, UserRepository } from '../repository';
import {
    BadRequestError,
    DuplicateError,
    NotFoundError,
    UnauthorizedError,
} from '../utils/errors';
import { compare, hash } from 'bcrypt';

class PasswordService {
    private SALT = 10;

    async encrypt(password: string) {
        return hash(password, this.SALT);
    }

    async compare(plain: string, cipher: string) {
        return compare(plain, cipher);
    }

    validatePasswordLength(password: string) {
        if (password.length < 8 || password.length > 12) {
            throw new BadRequestError('비밀번호는 8자 이상 12자 이하입니다.');
        }
    }

    validatePasswordNotChanged(newPassword: string, oldPassword: string) {
        if (newPassword == oldPassword) {
            throw new BadRequestError(
                '새로운 비밀번호가 기존 비밀번호와 동일합니다.',
            );
        }
    }
}

class UserService {
    private userRepository = new UserRepository();
    private organizationRepository = new OrganizationRepository();
    private passwordService = new PasswordService();

    async findAll() {
        const users = await this.userRepository.findAll();

        // 현재 비밀번호가 초기 비밀번호와 동일한 경우, 초기 비밀번호를 반환
        // 그렇지 않은 경우, null을 반환
        const userReponse = [];
        let user: any;
        for (user of users) {
            const unchangedPassword = await compare(
                user.initialPassword,
                user.password,
            );
            user.password = unchangedPassword ? user.initialPassword : null;
            userReponse.push(user);
            delete user.initialPassword;
        }
        return userReponse;
    }

    async create(dto: CreateUserDto) {
        await this.checkDuplicate(dto);

        dto.password = await this.passwordService.encrypt(dto.initialPassword);

        const organization = await this.findOrganizationByNameOrThrow(
            dto.organizationName,
        );
        const user = await this.userRepository.create(dto, organization.id);
        return {
            email: user.email,
            password: dto.initialPassword,
            role: user.role,
            is_disabled: user.isDisabled,
            organization_id: user.OrganizationId,
        };
    }

    private async checkDuplicate(dto: CreateUserDto) {
        logger.info(`Check duplication for email ${dto.email}`)

        const organization = await this.findOrganizationByNameOrThrow(
            dto.organizationName,
        );

        await this.checkDuplicatedOrganization(organization.id);
        await this.checkDuplicatedEmail(dto.email);
    }

    private async checkDuplicatedOrganization(organizationId: number) {
        logger.info(`Check duplication for organization ${organizationId}`)

        const user = await this.userRepository.findByOrganizationId(organizationId);
        if (user) {
            throw new DuplicateError(
                '이미 등록된 피감기구의 계정이 존재합니다.',
            );
        }
    }

    private async checkDuplicatedEmail(email: string) {
        logger.info(`Check duplication for email ${email}`)

        const user = await this.userRepository.findByEmail(email);
        if (user) {
            throw new DuplicateError('이미 등록된 이메일이 존재합니다.');
        }
    }

    async login(dto: LoginDto) {
        const user = await this.findUserByEmailOrThrow(dto.email);
        
        await this.matchPassword(dto.password, user.password);

        logger.info(`User: ${dto.email} logged in`);
        
        const organization = await this.findOrganizationByIdOrThrow(user.OrganizationId)
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            is_disabled: user.isDisabled,
            organizationId: user.OrganizationId,
            organization_name: organization.name,
        };
    }

    private async matchPassword(plain: string, cipher: string) {
        const match = await this.passwordService.compare(plain, cipher);
        if (!match) {
            throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');
        }
        logger.info('Password matched');
    }

    async changePassword(dto: ChangePasswordDto) {
        const user = await this.findUserByEmailOrThrow(dto.email);

        await this.matchPassword(dto.oldPassword, user.password);

        this.passwordService.validatePasswordLength(dto.newPassword);
        this.passwordService.validatePasswordNotChanged(dto.newPassword, dto.oldPassword);

        const encryptedPassword = await this.passwordService.encrypt(dto.newPassword);
        user.password = encryptedPassword;
        await user.save();
    }

    async disable(email: string) {
        const user = await this.findUserByEmailOrThrow(email);
        user.isDisabled = true;
        await user.save();
    }

    async enable(email: string) {
        const user = await this.findUserByEmailOrThrow(email);
        user.isDisabled = false;
        await user.save();
    }

    private async findUserByEmailOrThrow(email: string) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundError(
                `이메일 ${email}에 대한 유저를 찾을 수 없습니다.`,
            );
        }
        return user;
    }

    private async findOrganizationByIdOrThrow(id: string | number) {
        const organization = await this.organizationRepository.findById(id);
        if (!organization) {
            throw new NotFoundError(
                `피감기관 ${id}을 찾을 수 없습니다.`,
            );
        }
        return organization;
    }

    private async findOrganizationByNameOrThrow(name: string) {
        const organization = await this.organizationRepository.findByName(
            name,
        );
        if (!organization) {
            throw new NotFoundError(
                `피감기구 ${name}을 찾을 수 없습니다.`,
            );
        }
        return organization;
    }
}

export { UserService };
