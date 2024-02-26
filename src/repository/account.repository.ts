import {
    CreateAccountDto,
    DeleteAccountDto,
    GetAccountDto,
    UpdateAccountDto,
} from '../dto';
import { Account } from '../model';

class AccountRepository {
    async findAll(dto: GetAccountDto) {
        const accounts = await Account.findAll({
            where: {
                OrganizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
            order: [['accountNumber', 'ASC']],
        });
        return accounts;
    }

    async create(dto: CreateAccountDto) {
        const account = await Account.create({
            year: dto.year,
            half: dto.half,
            name: dto.name,
            accountNumber: dto.accountNumber,
            accountBank: dto.accountBank,
            accountOwner: dto.accountOwner,
            OrganizationId: dto.organizationId,
        });
        return account;
    }

    async update(dto: UpdateAccountDto) {
        await Account.update(
            {
                name: dto.name,
                accountNumber: dto.accountNumber,
                accountBank: dto.accountBank,
                accountOwner: dto.accountOwner,
            },
            {
                where: {
                    id: dto.accountId,
                },
            },
        );
    }

    async delete(dto: DeleteAccountDto) {
        await Account.destroy({
            where: {
                id: dto.accountId,
            },
        });
    }
}

export { AccountRepository };
