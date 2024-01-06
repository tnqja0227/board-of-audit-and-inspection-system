export class CreateIncomeDto {
    budgetId: string;
    code: string;
    source: string;
    category: string;
    content: string;
    amount: number;
    note: string | null;

    constructor(
        budgetId: string,
        code: string,
        source: string,
        category: string,
        content: string,
        amount: number,
        note: string | null,
    ) {
        this.budgetId = budgetId;
        this.code = code;
        this.source = source;
        this.category = category;
        this.content = content;
        this.amount = amount;
        this.note = note;
    }
}

export class UpdateIncomeDto {
    incomeId: string;
    source: string;
    category: string;
    content: string;
    amount: number;
    note: string | null;

    constructor(
        incomeId: string,
        source: string,
        category: string,
        content: string,
        amount: number,
        note: string | null,
    ) {
        this.incomeId = incomeId;
        this.source = source;
        this.category = category;
        this.content = content;
        this.amount = amount;
        this.note = note;
    }
}

export class DeleteIncomeDto {
    incomeId: string;

    constructor(incomeId: string) {
        this.incomeId = incomeId;
    }
}
