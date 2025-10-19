// src/types/errors.ts
// Кастомные типы ошибок для централизованной обработки

export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly statusCode: number = 500,
        public readonly isOperational: boolean = true,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export enum ErrorCode {
    DATABASE_ERROR = 'DATABASE_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
    IMAGE_GENERATION_ERROR = 'IMAGE_GENERATION_ERROR',
}

export class DatabaseError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, ErrorCode.DATABASE_ERROR, 500, true, context);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, context?: Record<string, unknown>) {
        super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, true, context);
    }
}

export class ImageGenerationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, ErrorCode.IMAGE_GENERATION_ERROR, 500, true, context);
    }
}