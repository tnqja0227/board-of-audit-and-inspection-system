import {
    CreateCardDto,
    DeleteCardDto,
    GetCardDto,
    UpdateCardDto,
} from '../dto';
import { Card } from '../model';

class CardRepository {
    async findAll(dto: GetCardDto) {
        const cards = await Card.findAll({
            where: {
                OrganizationId: dto.organizationId,
                year: dto.year,
                half: dto.half,
            },
            order: [['cardNumber', 'ASC']],
        });
        return cards;
    }

    async create(dto: CreateCardDto) {
        const card = await Card.create({
            year: dto.year,
            half: dto.half,
            name: dto.name,
            cardNumber: dto.cardNumber,
            OrganizationId: dto.organizationId,
        });
        return card;
    }

    async update(dto: UpdateCardDto) {
        await Card.update(
            {
                name: dto.name,
                cardNumber: dto.cardNumber,
            },
            {
                where: {
                    id: dto.cardId,
                },
            },
        );
    }

    async delete(dto: DeleteCardDto) {
        await Card.destroy({
            where: {
                id: dto.cardId,
            },
        });
    }
}

export { CardRepository };
