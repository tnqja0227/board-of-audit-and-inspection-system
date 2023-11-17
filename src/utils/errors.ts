export class NotFoundError extends Error {
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
        this.code = 404;
    }
}

export class ValidationError extends Error {
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
        this.code = 403;
    }
}

export class BadRequestError extends Error {
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
        this.code = 400;
    }
}
