export class GetCardDto {
    organizationId: string | number;
    year: string;
    half: string;

    constructor(organizationId: string | number, year: string, half: string) {
        this.organizationId = organizationId;
        this.year = year;
        this.half = half;
    }
}

export class CreateCardDto {
    organizationId: string | number;
    year: string;
    half: string;
    name: string | undefined;
    cardNumber: string;

    constructor(
        organizationId: string | number,
        year: string,
        half: string,
        name: string | undefined,
        cardNumber: string,
    ) {
        this.organizationId = organizationId;
        this.year = year;
        this.half = half;
        this.name = name;
        this.cardNumber = cardNumber;
    }
}

export class UpdateCardDto {
    cardId: string | number;
    name: string | undefined;
    cardNumber: string;

    constructor(
        cardId: string | number,
        name: string | undefined,
        cardNumber: string,
    ) {
        this.cardId = cardId;
        this.name = name;
        this.cardNumber = cardNumber;
    }
}

export class DeleteCardDto {
    cardId: string | number;

    constructor(cardId: string | number) {
        this.cardId = cardId;
    }
}
