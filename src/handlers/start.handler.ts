// src/handlers/start.handler.ts
// Обработчик команды /start

import { MESSAGES } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { resetSession, updateSessionStep } from '../middleware/session.middleware.js';
import { RegistrationStep } from '../types/bot.js';
import { createTermsKeyboard } from '../keyboards/navigation.keyboard.js';
import type { BotContext } from '../types/bot.js';

export async function handleStart(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;

    logger.info('Start command received', { userId, username });

    // Сбрасываем сессию при новом старте
    resetSession(ctx);

    // Отправляем приветственное сообщение
    await ctx.reply(
        `${MESSAGES.START.TITLE}\n\n${MESSAGES.START.DESCRIPTION}`,
        { parse_mode: 'Markdown' }
    );

    // Отправляем сообщение с условиями использования
    await ctx.reply(MESSAGES.TERMS.TEXT, {
        parse_mode: 'Markdown',
        reply_markup: createTermsKeyboard(),
    });

    // Обновляем шаг регистрации
    updateSessionStep(ctx, RegistrationStep.TERMS_AGREEMENT);

    logger.debug('Start handler completed', { userId });
}