import {
    CreateCardDto,
    DeleteCardDto,
    GetCardDto,
    UpdateCardDto,
} from '../dto';
import { CardRepository } from '../repository';

class CardService {
    private cardRepository: CardRepository = new CardRepository();

    async findAll(dto: GetCardDto) {
        const cards = await this.cardRepository.findAll(dto);
        return cards;
    }

    async create(dto: CreateCardDto) {
        const card = await this.cardRepository.create(dto);
        return card;
    }

    async update(dto: UpdateCardDto) {
        await this.cardRepository.update(dto);
    }

    async delete(dto: DeleteCardDto) {
        await this.cardRepository.delete(dto);
    }
}

export { CardService };
