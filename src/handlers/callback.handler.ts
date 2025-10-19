// src/handlers/callback.handler.ts
// Централизованный обработчик callback queries

import { logger } from '../utils/logger.js';
import { parseCallbackData } from '../utils/validators.js';
import { CallbackAction } from '../types';
import { handleAgreeTerms, handleDepartmentSelection, handleCourseSelection, handleGroupSelection, handleNavigateBack, handleGroupPagination } from './registration.handler.js';
import type { BotContext } from '../types';

export async function handleCallbackQuery(ctx: BotContext): Promise<void> {
    const callbackData = ctx.callbackQuery?.data;

    if (!callbackData) {
        await ctx.answerCallbackQuery('Ошибка: нет данных');
        return;
    }

    // Игнорируем noop callbacks
    if (callbackData === 'noop') {
        await ctx.answerCallbackQuery();
        return;
    }

    try {
        const { action, value } = parseCallbackData(callbackData);

        logger.debug('Callback query received', {
            userId: ctx.from?.id,
            action,
            value
        });

        switch (action) {
            case CallbackAction.AGREE_TERMS:
                await handleAgreeTerms(ctx);
                break;

            case CallbackAction.SELECT_DEPARTMENT:
                await handleDepartmentSelection(ctx);
                break;

            case CallbackAction.SELECT_COURSE:
                await handleCourseSelection(ctx);
                break;

            case CallbackAction.SELECT_GROUP:
                await handleGroupSelection(ctx);
                break;

            case CallbackAction.NAVIGATE_BACK:
                await handleNavigateBack(ctx);
                break;

            case CallbackAction.NAVIGATE_NEXT:
                if (value) {
                    await handleGroupPagination(ctx, parseInt(value, 10));
                }
                break;

            case CallbackAction.NAVIGATE_PREV:
                if (value) {
                    await handleGroupPagination(ctx, parseInt(value, 10));
                }
                break;

            default:
                await ctx.answerCallbackQuery('Неизвестное действие');
                logger.warn('Unknown callback action', { action, value });
                break;
        }
    } catch (error) {
        logger.error('Failed to handle callback query', { callbackData, error });
        await ctx.answerCallbackQuery('Произошла ошибка. Попробуйте еще раз.');
        throw error;
    }
}