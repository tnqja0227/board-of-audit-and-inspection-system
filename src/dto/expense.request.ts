export class CreateExpenseDto {
    budgetId: string;
    code: string;
    source: string;
    category: string;
    project: string;
    content: string;
    amount: number;
    note: string | null;

    constructor(
        budgetId: string,
        code: string,
        source: string,
        category: string,
        project: string,
        content: string,
        amount: number,
        note: string | null,
    ) {
        this.budgetId = budgetId;
        this.code = code;
        this.source = source;
        this.category = category;
        this.project = project;
        this.content = content;
        this.amount = amount;
        this.note = note;
    }
}

export class UpdateExpenseDto {
    expenseId: string;
    source: string;
    category: string;
    project: string;
    content: string;
    amount: number;
    note: string | null;

    constructor(
        expenseId: string,
        source: string,
        category: string,
        project: string,
        content: string,
        amount: number,
        note: string | null,
    ) {
        this.expenseId = expenseId;
        this.source = source;
        this.category = category;
        this.project = project;
        this.content = content;
        this.amount = amount;
        this.note = note;
    }
}

export class DeleteExpenseDto {
    expenseId: string;

    constructor(expenseId: string) {
        this.expenseId = expenseId;
    }
}
