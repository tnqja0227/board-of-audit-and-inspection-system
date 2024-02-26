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

export class UnauthorizedError extends Error {
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
        this.code = 401;
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

export class DuplicateError extends Error {
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'DuplicateError';
        this.code = 409;
    }
}

export class BadGatewayError extends Error {
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'BadGatewayError';
        this.code = 502;
    }
}
