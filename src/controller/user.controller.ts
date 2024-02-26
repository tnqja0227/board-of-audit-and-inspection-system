import { Request, Response, NextFunction } from 'express';
import { UserService } from '../service';
import logger from '../config/winston';
import { ChangePasswordDto, CreateUserDto, LoginDto } from '../dto';

class UserController {
    private userService: UserService = new UserService();

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('UserController: findAll called');

        const users = await this.userService.findAll();
        res.json(users);
    };

    createAdmin = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('UserController: createAdmin called');

        const email = req.body.email;
        const password = req.body.password;
        const user = await this.userService.createAdmin(email, password);
        res.json(user);
    };

    createUser = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('UserController: createUser called');

        const email = req.body.email;
        const organizationName = req.body.organization_name;
        const dto = new CreateUserDto(email, organizationName);
        const user = await this.userService.create(dto);
        res.json(user);
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('UserController: login called');

        const email = req.body.email;
        const password = req.body.password;
        const dto = new LoginDto(email, password);
        const user = await this.userService.login(dto);
        req.session.user = {
            id: user.id,
            role: user.role,
            OrganizationId: user.organizationId,
        };

        res.json(user);
    };

    changePassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        logger.info('UserController: changePassword called');

        const email = req.body.email;
        const oldPassword = req.body.password;
        const newPassword = req.body.new_password;
        const dto = new ChangePasswordDto(email, oldPassword, newPassword);
        const user = await this.userService.changePassword(dto);
        res.sendStatus(200);
    };

    disableUser = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('UserController: disableUser called');

        const email = req.body.email;
        await this.userService.disable(email);
        res.sendStatus(200);
    };

    enableUser = async (req: Request, res: Response, next: NextFunction) => {
        logger.info('UserController: enableUser called');

        const email = req.body.email;
        await this.userService.enable(email);
        res.sendStatus(200);
    };
}

export { UserController };
