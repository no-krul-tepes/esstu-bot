// src/middleware/logging.middleware.ts
// Логирование запросов и обновлений

import { logger } from '../utils/logger.js';
import type { BotContext } from '../types';

export async function loggingMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void> {
    const start = Date.now();

    // Логируем входящее обновление
    logger.debug('Incoming update', {
        updateId: ctx.update.update_id,
        type: getUpdateType(ctx),
        userId: ctx.from?.id,
        username: ctx.from?.username,
        chatId: ctx.chat?.id,
    });

    try {
        await next();

        const duration = Date.now() - start;
        logger.debug('Update processed', {
            updateId: ctx.update.update_id,
            duration: `${duration}ms`,
        });
    } catch (error) {
        const duration = Date.now() - start;
        logger.error('Update processing failed', {
            updateId: ctx.update.update_id,
            duration: `${duration}ms`,
            error,
        });
        throw error;
    }
}

function getUpdateType(ctx: BotContext): string {
    if (ctx.message?.text) return 'message:text';
    if (ctx.message?.photo) return 'message:photo';
    if (ctx.callbackQuery) return 'callback_query';
    if (ctx.inlineQuery) return 'inline_query';
    return 'unknown';
}