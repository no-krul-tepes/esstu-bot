// src/bot.ts
// Инициализация и конфигурация Grammy бота

import { Bot } from 'grammy';
import { sessionMiddleware } from './middleware/session.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { handleStart } from './handlers/start.handler.js';
import { handleSettings } from './handlers/settings.handler.js';
import { handleSchedule } from './handlers/schedule.handler.js';
import { handleHelp } from './handlers/help.handler.js';
import { handleUnsubscribe } from './handlers/unsubscribe.handler.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import { sendScheduleAfterRegistration } from './handlers/schedule.handler.js';
import { logger } from './utils/logger.js';
import { RegistrationStep } from './types';
import type { BotContext } from './types';

export function createBot(token: string): Bot<BotContext> {
    const bot = new Bot<BotContext>(token);

    // Применяем middleware в правильном порядке
    bot.use(loggingMiddleware);
    bot.use(sessionMiddleware);
    bot.use(errorMiddleware);
    bot.use(rateLimitMiddleware);

    // Регистрируем обработчики команд
    registerCommands(bot);

    // Регистрируем обработчики callback queries
    registerCallbackHandlers(bot);

    logger.info('Bot initialized successfully');

    return bot;
}

function registerCommands(bot: Bot<BotContext>): void {
    bot.command('start', async (ctx) => {
        await handleStart(ctx);
    });

    bot.command('schedule', async (ctx) => {
        await handleSchedule(ctx);
    });

    // Новая команда
    bot.command('settings', async (ctx) => {
        await handleSettings(ctx);
    });

    bot.command('help', async (ctx) => {
        await handleHelp(ctx);
    });

    bot.command('unsubscribe', async (ctx) => {
        await handleUnsubscribe(ctx);
    });

    bot.on('message:text', async (ctx) => {
        const text = ctx.message.text;

        if (text.startsWith('/')) {
            await ctx.reply(
                '❓ Неизвестная команда.\n\n' +
                'Используйте /help для просмотра доступных команд.'
            );
        }
    });

    logger.debug('Commands registered');
}

function registerCallbackHandlers(bot: Bot<BotContext>): void {
    // Все callback queries обрабатываются централизованно
    bot.on('callback_query:data', async (ctx) => {
        await handleCallbackQuery(ctx);

        // Отправляем расписание только после завершения ПЕРВИЧНОЙ регистрации
        // (не при смене группы из настроек)
        const isChangingGroup = ctx.session.settings?.changingGroup === true;
        const shouldSendSchedule = ctx.session.shouldSendSchedule === true;

        if (shouldSendSchedule &&
            ctx.session.step === RegistrationStep.COMPLETED &&
            ctx.session.selectedGroupId &&
            !isChangingGroup) {
            await sendScheduleAfterRegistration(ctx);
            ctx.session.shouldSendSchedule = false;
        }
    });

    logger.debug('Callback handlers registered');
}

// Установка команд бота для UI Telegram
export async function setupBotCommands(bot: Bot<BotContext>): Promise<void> {
    try {
        await bot.api.setMyCommands([
            { command: 'start', description: 'Начать регистрацию' },
            { command: 'schedule', description: 'Показать расписание' },
            { command: 'settings', description: 'Настройки' },
            { command: 'help', description: 'Помощь' },
            { command: 'unsubscribe', description: 'Удалить данные и отписаться' },
        ]);

        logger.info('Bot commands set successfully');
    } catch (error) {
        logger.error('Failed to set bot commands', { error });
    }
}

// Graceful shutdown
export async function stopBot(bot: Bot<BotContext>): Promise<void> {
    try {
        await bot.stop();
        logger.info('Bot stopped gracefully');
    } catch (error) {
        logger.error('Error stopping bot', { error });
        throw error;
    }
}