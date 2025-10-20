// src/handlers/settings.handler.ts
// Обработчики для меню настроек

import { MESSAGES, EMOJI } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { parseCallbackData } from '../utils/validators.js';
import {
    getChatByExternalId,
    getGroupById,
} from '../services/database.service.js';
import {
    toggleNotifications,
    toggleEveryLessonNotification,
    changeNotificationTime,
    changeGroup,
    formatNotificationStatus,
} from '../services/settings.service.js';
import {
    createSettingsMainKeyboard,
    createChangeGroupConfirmKeyboard,
    createNotificationTimeKeyboard,
} from '../keyboards/settings.keyboard.js';
import { resetSession, updateSessionStep } from '../middleware/session.middleware.js';
import { RegistrationStep } from '../types/bot.js';
import { showDepartmentSelection } from './registration.handler.js';
import type { BotContext } from '../types/bot.js';

export async function handleSettings(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.reply('❌ Ошибка: не удалось определить чат');
        return;
    }

    try {
        const externalChatId = chatId.toString();

        logger.debug('Settings command received', {
            userId: ctx.from?.id,
            externalChatId
        });

        const chat = await getChatByExternalId(externalChatId);

        if (!chat) {
            await ctx.reply(
                '❌ Вы не зарегистрированы!\n\n' +
                'Используйте команду /start для регистрации.'
            );
            return;
        }

        const group = await getGroupById(chat.groupid);

        const settingsText = formatSettingsMessage(chat, group);

        await ctx.reply(settingsText, {
            parse_mode: 'Markdown',
            reply_markup: createSettingsMainKeyboard(chat, group),
        });

        logger.info('Settings opened', {
            userId: ctx.from?.id,
            chatId: chat.chatid,
            groupId: chat.groupid,
        });
    } catch (error) {
        logger.error('Failed to handle settings command', {
            error,
            userId: ctx.from?.id,
            chatId
        });
        throw error;
    }
}

export async function handleToggleNotifications(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить чат');
        return;
    }

    try {
        const externalChatId = chatId.toString();
        const updatedChat = await toggleNotifications(externalChatId);
        const group = await getGroupById(updatedChat.groupid);

        const message = updatedChat.isnotificationenabled
            ? MESSAGES.SETTINGS.NOTIFICATIONS_ENABLED
            : MESSAGES.SETTINGS.NOTIFICATIONS_DISABLED;

        await ctx.answerCallbackQuery(message);

        const settingsText = formatSettingsMessage(updatedChat, group);

        await ctx.editMessageText(settingsText, {
            parse_mode: 'Markdown',
            reply_markup: createSettingsMainKeyboard(updatedChat, group),
        });

        logger.info('Notifications toggled', {
            userId: ctx.from?.id,
            enabled: updatedChat.isnotificationenabled,
        });
    } catch (error) {
        logger.error('Failed to toggle notifications', { error });
        throw error;
    }
}

export async function handleToggleEveryLesson(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить чат');
        return;
    }

    try {
        const externalChatId = chatId.toString();
        const updatedChat = await toggleEveryLessonNotification(externalChatId);
        const group = await getGroupById(updatedChat.groupid);

        const message = updatedChat.notifyoneverylesson
            ? MESSAGES.SETTINGS.EVERY_LESSON_ENABLED
            : MESSAGES.SETTINGS.EVERY_LESSON_DISABLED;

        await ctx.answerCallbackQuery(message);

        const settingsText = formatSettingsMessage(updatedChat, group);

        await ctx.editMessageText(settingsText, {
            parse_mode: 'Markdown',
            reply_markup: createSettingsMainKeyboard(updatedChat, group),
        });

        logger.info('Every lesson notification toggled', {
            userId: ctx.from?.id,
            enabled: updatedChat.notifyoneverylesson,
        });
    } catch (error) {
        logger.error('Failed to toggle every lesson notification', { error });
        throw error;
    }
}

export async function handleChangeNotificationTime(ctx: BotContext): Promise<void> {
    await ctx.answerCallbackQuery();

    await ctx.editMessageText(MESSAGES.SETTINGS.NOTIFICATION_TIME_SELECT, {
        reply_markup: createNotificationTimeKeyboard(),
    });

    logger.debug('Notification time selection opened', {
        userId: ctx.from?.id,
    });
}

export async function handleSetNotificationTime(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId || !ctx.callbackQuery?.data) {
        await ctx.answerCallbackQuery('Ошибка');
        return;
    }

    try {
        const { value } = parseCallbackData(ctx.callbackQuery.data);

        if (!value) {
            await ctx.answerCallbackQuery('Ошибка: некорректные данные');
            return;
        }

        const externalChatId = chatId.toString();
        const updatedChat = await changeNotificationTime(externalChatId, value);
        const group = await getGroupById(updatedChat.groupid);

        const message = MESSAGES.SETTINGS.NOTIFICATION_TIME_CHANGED.replace(
            '{time}',
            value.slice(0, 5)
        );

        await ctx.answerCallbackQuery(message);

        const settingsText = formatSettingsMessage(updatedChat, group);

        await ctx.editMessageText(settingsText, {
            parse_mode: 'Markdown',
            reply_markup: createSettingsMainKeyboard(updatedChat, group),
        });

        logger.info('Notification time changed', {
            userId: ctx.from?.id,
            newTime: value,
        });
    } catch (error) {
        logger.error('Failed to set notification time', { error });
        throw error;
    }
}

export async function handleChangeGroup(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить чат');
        return;
    }

    try {
        const externalChatId = chatId.toString();
        const chat = await getChatByExternalId(externalChatId);

        if (!chat) {
            await ctx.answerCallbackQuery('Ошибка: чат не найден');
            return;
        }

        const group = await getGroupById(chat.groupid);

        await ctx.answerCallbackQuery();

        const confirmText = MESSAGES.SETTINGS.CHANGE_GROUP_CONFIRM.replace(
            '{groupName}',
            group.name
        );

        await ctx.editMessageText(confirmText, {
            reply_markup: createChangeGroupConfirmKeyboard(),
        });

        logger.debug('Change group confirmation shown', {
            userId: ctx.from?.id,
            currentGroupId: group.groupid,
        });
    } catch (error) {
        logger.error('Failed to show change group confirmation', { error });
        throw error;
    }
}

export async function handleConfirmChangeGroup(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить чат');
        return;
    }

    try {
        await ctx.answerCallbackQuery('Начинаем смену группы...');

        // Удаляем текущее сообщение с подтверждением
        await ctx.deleteMessage();

        // Сообщаем пользователю о начале процесса
        await ctx.reply(
            '🔄 **Смена группы**\n\n' +
            'Выберите новую группу, следуя инструкциям ниже.',
            { parse_mode: 'Markdown' }
        );

        // Устанавливаем флаг смены группы и необходимые данные для обхода проверок
        ctx.session.settings = { changingGroup: true };
        ctx.session.agreedToTerms = true; // Обходим проверку согласия

        // Запускаем процесс выбора
        await showDepartmentSelection(ctx);

        logger.info('Group change process started', {
            userId: ctx.from?.id,
            chatId,
        });
    } catch (error) {
        logger.error('Failed to start group change', { error });

        await ctx.reply(
            '❌ Не удалось начать смену группы. Попробуйте позже.'
        );

        throw error;
    }
}

export async function handleCancelAction(ctx: BotContext): Promise<void> {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();

    logger.debug('Settings action cancelled', {
        userId: ctx.from?.id,
    });
}

// Вспомогательная функция для форматирования сообщения настроек
function formatSettingsMessage(chat: any, group: any): string {
    const groupInfo = MESSAGES.SETTINGS.GROUP_INFO
        .replace('{groupName}', group.name)
        .replace('{course}', group.course.toString());

    const notifyStatus = chat.isnotificationenabled ? '✅ Включены' : '🔕 Отключены';
    const time = chat.notificationtime.slice(0, 5);
    const everyLesson = chat.notifyoneverylesson ? '✅ Да' : '❌ Нет';

    const notificationInfo = MESSAGES.SETTINGS.NOTIFICATION_INFO
        .replace('{status}', notifyStatus)
        .replace('{time}', time)
        .replace('{everyLesson}', everyLesson);

    return `${MESSAGES.SETTINGS.MAIN}\n\n${groupInfo}\n\n${notificationInfo}`;
}