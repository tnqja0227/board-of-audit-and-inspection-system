export class GetAccountDto {
    organizationId: string | number;
    year: string;
    half: string;

    constructor(organizationId: string | number, year: string, half: string) {
        this.organizationId = organizationId;
        this.year = year;
        this.half = half;
    }
}

export class CreateAccountDto {
    organizationId: string | number;
    year: string;
    half: string;
    name: string | undefined;
    accountNumber: string;
    accountBank: string;
    accountOwner: string;

    constructor(
        organizationId: string | number,
        year: string,
        half: string,
        name: string | undefined,
        accountNumber: string,
        accountBank: string,
        accountOwner: string,
    ) {
        this.organizationId = organizationId;
        this.year = year;
        this.half = half;
        this.name = name;
        this.accountNumber = accountNumber;
        this.accountBank = accountBank;
        this.accountOwner = accountOwner;
    }
}

export class UpdateAccountDto {
    accountId: string | number;
    name: string | undefined;
    accountNumber: string;
    accountBank: string;
    accountOwner: string;

    constructor(
        accountId: string | number,
        name: string | undefined,
        accountNumber: string,
        accountBank: string,
        accountOwner: string,
    ) {
        this.accountId = accountId;
        this.name = name;
        this.accountNumber = accountNumber;
        this.accountBank = accountBank;
        this.accountOwner = accountOwner;
    }
}

export class DeleteAccountDto {
    accountId: string | number;

    constructor(accountId: string | number) {
        this.accountId = accountId;
    }
}
