// src/middleware/error.middleware.ts
import { BotError, GrammyError, HttpError } from 'grammy';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../config/constants.js';
import { AppError, ErrorCode } from '../types';
import type { BotContext } from '../types';

export async function errorHandler(err: BotError<BotContext>): Promise<void> {
    const ctx = err.ctx;

    const rawError = err.error;
    const error: Error =
        rawError instanceof Error
            ? rawError
            : new Error(String(rawError));

    logger.error('Bot error occurred', {
        updateId: ctx.update.update_id,
        userId: ctx.from?.id,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
    });

    let userMessage: string = MESSAGES.ERRORS.GENERIC;

    if (error instanceof AppError) {
        userMessage = getUserMessageForAppError(error);
    } else if (error instanceof GrammyError) {
        userMessage = getUserMessageForGrammyError(error);
    } else if (error instanceof HttpError) {
        userMessage = 'Ошибка сети. Проверьте подключение к интернету.';
    }

    try {
        if (userMessage) {
            await ctx.reply(userMessage);
        }
    } catch (replyError) {
        logger.error('Failed to send error message to user', { replyError });
    }
}

function getUserMessageForAppError(error: AppError): string {
    switch (error.code) {
        case ErrorCode.DATABASE_ERROR:
            return MESSAGES.ERRORS.DATABASE;
        case ErrorCode.NOT_FOUND:
            return MESSAGES.ERRORS.NOT_FOUND;
        case ErrorCode.VALIDATION_ERROR:
            return `❌ Некорректные данные: ${error.message}`;
        case ErrorCode.RATE_LIMIT_EXCEEDED:
            return MESSAGES.ERRORS.RATE_LIMIT;
        case ErrorCode.IMAGE_GENERATION_ERROR:
            return MESSAGES.ERRORS.IMAGE_GENERATION;
        default:
            return MESSAGES.ERRORS.GENERIC;
    }
}

function getUserMessageForGrammyError(error: GrammyError): string {
    const desc = (error.description || '').toLowerCase();

    if (desc.includes('message is not modified')) {
        return '';
    }
    if (desc.includes('bot was blocked')) {
        logger.info('Bot was blocked by user');
        return '';
    }
    if (desc.includes('chat not found')) {
        return 'Чат не найден. Попробуйте начать заново с /start';
    }
    return MESSAGES.ERRORS.GENERIC;
}

export async function errorMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
    try {
        await next();
    } catch (rawError) {
        const error: Error =
            rawError instanceof Error
                ? rawError
                : new Error(String(rawError));

        logger.error('Error in handler', {
            updateId: ctx.update.update_id,
            userId: ctx.from?.id,
            error,
        });

        let userMessage: string = MESSAGES.ERRORS.GENERIC;
        if (error instanceof AppError) {
            userMessage = getUserMessageForAppError(error);
        }

        if (userMessage) {
            await ctx.reply(userMessage).catch(err => {
                logger.error('Failed to send error message', { err });
            });
        }
    }
}
