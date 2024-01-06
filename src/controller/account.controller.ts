import { Request, Response, NextFunction } from 'express';
import {
    CreateAccountDto,
    DeleteAccountDto,
    GetAccountDto,
    UpdateAccountDto,
} from '../dto';
import { AccountService } from '../service';

class AccountController {
    private accountService: AccountService = new AccountService();

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new GetAccountDto(
            req.params.organization_id,
            req.params.year,
            req.params.half,
        );
        const accounts = await this.accountService.findAll(dto);
        res.json(accounts.map((account) => account.toJSON()));
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new CreateAccountDto(
            req.params.organization_id,
            req.params.year,
            req.params.half,
            req.body.name,
            req.body.accountNumber,
            req.body.accountBank,
            req.body.accountOwner,
            req.body.cardNumber,
        );
        const account = await this.accountService.create(dto);
        res.json(account.toJSON());
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new UpdateAccountDto(
            req.params.account_id,
            req.body.name,
            req.body.accountNumber,
            req.body.accountBank,
            req.body.accountOwner,
            req.body.cardNumber,
        );
        await this.accountService.update(dto);
        res.json({ success: true });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new DeleteAccountDto(req.params.account_id);
        await this.accountService.delete(dto);
        res.json({ success: true });
    };
}

export { AccountController };
