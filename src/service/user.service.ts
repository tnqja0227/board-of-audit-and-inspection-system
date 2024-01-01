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

const SALT = 10;

class UserService {
    private userRepository = new UserRepository();
    private organizationRepository = new OrganizationRepository();

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
        await this.validateCreation(dto);
        dto.password = await this.encrypt(dto.initialPassword);

        const user = await this.userRepository.create(dto);
        return {
            email: user.email,
            password: dto.initialPassword,
            role: user.role,
            is_disabled: user.isDisabled,
            organization_id: user.OrganizationId,
        };
    }

    async encrypt(password: string) {
        return hash(password, SALT);
    }

    private async validateCreation(dto: CreateUserDto) {
        const organization = await this.organizationRepository.findByName(
            dto.organizationName,
        );
        logger.info(
            `Validate creation for email ${dto.email} and organization ${organization.name}`,
        );

        if (await this.duplicatedOrganization(organization.id)) {
            throw new DuplicateError(
                '이미 등록된 피감기구의 계정이 존재합니다.',
            );
        }
        if (await this.duplicatedEmail(dto.email)) {
            throw new DuplicateError('이미 등록된 이메일이 존재합니다.');
        }
        logger.info(`${dto.email} passed duplicate check for creation`);
    }

    private async duplicatedOrganization(organizationId: number) {
        try {
            await this.userRepository.findByOrganizationId(organizationId);
            return true;
        } catch (e) {
            if (e instanceof NotFoundError) return false;
        }
    }

    private async duplicatedEmail(email: string) {
        try {
            await this.userRepository.findByEmail(email);
            return true;
        } catch (e) {
            if (e instanceof NotFoundError) return false;
        }
    }

    async login(dto: LoginDto) {
        const user = await this.userRepository.findByEmail(dto.email);
        await this.checkPassword(dto.password, user.password);

        logger.info(`User: ${dto.email} logged in`);
        const organization = await this.organizationRepository.findById(
            user.OrganizationId,
        );

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            is_disabled: user.isDisabled,
            organizationId: user.OrganizationId,
            organization_name: organization.name,
        };
    }

    private async checkPassword(plain: string, cipher: string) {
        const match = await compare(plain, cipher);
        if (!match) {
            throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');
        }
        logger.info(`password matched`);
    }

    async changePassword(dto: ChangePasswordDto) {
        const user = await this.userRepository.findByEmail(dto.email);
        await this.checkPassword(dto.oldPassword, user.password);
        this.checkPasswordCondition(dto.newPassword);
        this.checkNewPasswordNotChanged(dto.newPassword, dto.oldPassword);

        const encryptedPassword = await this.encrypt(dto.newPassword);
        user.password = encryptedPassword;
        await user.save();
    }

    private checkPasswordCondition(password: string) {
        if (password.length < 8 || password.length > 12) {
            throw new BadRequestError('비밀번호는 8자 이상 12자 이하입니다.');
        }
    }

    private checkNewPasswordNotChanged(
        newPassword: string,
        oldPassword: string,
    ) {
        if (newPassword == oldPassword) {
            throw new BadRequestError(
                '새로운 비밀번호가 기존 비밀번호와 동일합니다.',
            );
        }
    }

    async disable(email: string) {
        const user = await this.userRepository.findByEmail(email);
        user.isDisabled = true;
        await user.save();
    }

    async enable(email: string) {
        const user = await this.userRepository.findByEmail(email);
        user.isDisabled = false;
        await user.save();
    }
}

export { UserService };
