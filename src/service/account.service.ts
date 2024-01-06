import {
    CreateAccountDto,
    DeleteAccountDto,
    GetAccountDto,
    UpdateAccountDto,
} from '../dto';
import { AccountRepository } from '../repository';

class AccountService {
    private accountRepository: AccountRepository = new AccountRepository();

    async findAll(dto: GetAccountDto) {
        const accounts = await this.accountRepository.findAll(dto);
        return accounts;
    }

    async create(dto: CreateAccountDto) {
        const account = await this.accountRepository.create(dto);
        return account;
    }

    async update(dto: UpdateAccountDto) {
        await this.accountRepository.update(dto);
    }

    async delete(dto: DeleteAccountDto) {
        await this.accountRepository.delete(dto);
    }
}

export { AccountService };
