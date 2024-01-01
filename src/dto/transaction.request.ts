export class GetTransactionDto {
    organizationId: string | number;
    year: string | number;
    half: string;

    constructor(
        organizationId: string | number,
        year: string | number,
        half: string,
    ) {
        this.organizationId = organizationId;
        this.year = year;
        this.half = half;
    }
}

export class CreateTransactionDto {
    projectAt: Date;
    manager: string;
    content: string;
    type: string;
    amount: number;
    balance: number = 0;
    transactionAt: Date;
    accountNumber: string;
    accountBank: string;
    accountOwner: string;
    receivingAccountNumber: string;
    receivingAccountBank: string;
    receivingAccountOwner: string;
    hasBill: boolean;
    note: string | undefined;
    incomeId: number | undefined;
    expenseId: number | undefined;

    constructor(
        projectAt: Date,
        manager: string,
        content: string,
        type: string,
        amount: number,
        transactionAt: Date,
        accountNumber: string,
        accountBank: string,
        accountOwner: string,
        receivingAccountNumber: string,
        receivingAccountBank: string,
        receivingAccountOwner: string,
        hasBill: boolean,
        note: string | undefined,
        incomeId: number | undefined,
        expenseId: number | undefined,
    ) {
        this.projectAt = projectAt;
        this.manager = manager;
        this.content = content;
        this.type = type;
        this.amount = amount;
        this.transactionAt = transactionAt;
        this.accountNumber = accountNumber;
        this.accountBank = accountBank;
        this.accountOwner = accountOwner;
        this.receivingAccountNumber = receivingAccountNumber;
        this.receivingAccountBank = receivingAccountBank;
        this.receivingAccountOwner = receivingAccountOwner;
        this.hasBill = hasBill;
        this.note = note;
        this.incomeId = incomeId;
        this.expenseId = expenseId;
    }
}

export class UpdateTransactionDto {
    transactionId: number | string;
    projectAt: Date;
    manager: string;
    content: string;
    type: string;
    amount: number;
    transactionAt: Date;
    accountNumber: string;
    accountBank: string;
    accountOwner: string;
    receivingAccountNumber: string;
    receivingAccountBank: string;
    receivingAccountOwner: string;
    hasBill: boolean;
    note: string | undefined;
    incomeId: number | undefined;
    expenseId: number | undefined;

    constructor(
        transactionId: number | string,
        projectAt: Date,
        manager: string,
        content: string,
        type: string,
        amount: number,
        transactionAt: Date,
        accountNumber: string,
        accountBank: string,
        accountOwner: string,
        receivingAccountNumber: string,
        receivingAccountBank: string,
        receivingAccountOwner: string,
        hasBill: boolean,
        note: string | undefined,
        incomeId: number | undefined,
        expenseId: number | undefined,
    ) {
        this.transactionId = transactionId;
        this.projectAt = projectAt;
        this.manager = manager;
        this.content = content;
        this.type = type;
        this.amount = amount;
        this.transactionAt = transactionAt;
        this.accountNumber = accountNumber;
        this.accountBank = accountBank;
        this.accountOwner = accountOwner;
        this.receivingAccountNumber = receivingAccountNumber;
        this.receivingAccountBank = receivingAccountBank;
        this.receivingAccountOwner = receivingAccountOwner;
        this.hasBill = hasBill;
        this.note = note;
        this.incomeId = incomeId;
        this.expenseId = expenseId;
    }
}
