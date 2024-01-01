export class BudgetRequestDto {
    organizationId: string;
    year: string;
    half: string;

    constructor(organizationId: string, year: string, half: string) {
        this.organizationId = organizationId;
        this.year = year;
        this.half = half;
    }
}
