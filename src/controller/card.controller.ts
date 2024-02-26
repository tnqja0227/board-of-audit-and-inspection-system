import { Request, Response, NextFunction } from 'express';
import {
    CreateCardDto,
    DeleteCardDto,
    GetCardDto,
    UpdateCardDto,
} from '../dto';
import { CardService } from '../service';

class CardController {
    private cardService: CardService = new CardService();

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new GetCardDto(
            req.params.organization_id,
            req.params.year,
            req.params.half,
        );
        const cards = await this.cardService.findAll(dto);
        res.json(cards.map((card) => card.toJSON()));
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new CreateCardDto(
            req.params.organization_id,
            req.params.year,
            req.params.half,
            req.body.name,
            req.body.cardNumber,
        );
        const card = await this.cardService.create(dto);
        res.json(card.toJSON());
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new UpdateCardDto(
            req.params.card_id,
            req.body.name,
            req.body.cardNumber,
        );
        await this.cardService.update(dto);
        res.sendStatus(200);
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        const dto = new DeleteCardDto(req.params.card_id);
        await this.cardService.delete(dto);
        res.sendStatus(200);
    };
}

export { CardController };
