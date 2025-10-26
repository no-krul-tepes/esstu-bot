// src/handlers/callback.handler.ts
// Централизованный обработчик callback queries (ОБНОВЛЕННАЯ ВЕРСИЯ)

import { logger } from '../utils/logger.js';
import { parseCallbackData } from '../utils/validators.js';
import { CallbackAction } from '../types';
import {
    handleAgreeTerms,
    handleDepartmentSelection,
    handleCourseSelection,
    handleGroupSelection,
    handleNavigateBack,
    handleGroupPagination,
    isChangingGroupMode,
} from './registration.handler.js';
import {
    handleToggleNotifications,
    handleToggleEveryLesson,
    handleChangeNotificationTime,
    handleSetNotificationTime,
    handleChangeGroup,
    handleConfirmChangeGroup,
    handleCancelAction,
} from './settings.handler.js';
import { getChatByExternalId, getGroupById, countChatsByGroupId } from '../services/database.service.js';
import { MESSAGES } from '../config/constants.js';
import type { BotContext } from '../types';
import { changeGroup } from '../services/settings.service.js';
import { triggerGroupParsing } from '../services/parse.service.js';

export async function handleCallbackQuery(ctx: BotContext): Promise<void> {
    const callbackData = ctx.callbackQuery?.data;

    if (!callbackData) {
        await ctx.answerCallbackQuery('Ошибка: нет данных');
        return;
    }

    if (callbackData === 'noop') {
        await ctx.answerCallbackQuery();
        return;
    }

    try {
        const { action, value } = parseCallbackData(callbackData);

        logger.debug('Callback query received', {
            userId: ctx.from?.id,
            action,
            value,
            isChangingGroup: isChangingGroupMode(ctx),
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
                // Проверяем, меняем ли мы группу из настроек
                if (isChangingGroupMode(ctx) && value) {
                    await handleGroupChangeComplete(ctx, parseInt(value, 10));
                } else {
                    await handleGroupSelection(ctx);
                }
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


            // Settings actions
            case CallbackAction.TOGGLE_NOTIFICATIONS:
                await handleToggleNotifications(ctx);
                break;

            case CallbackAction.TOGGLE_EVERY_LESSON:
                await handleToggleEveryLesson(ctx);
                break;

            case CallbackAction.CHANGE_NOTIFICATION_TIME:
                await handleChangeNotificationTime(ctx);
                break;

            case CallbackAction.SET_NOTIFICATION_TIME:
                await handleSetNotificationTime(ctx);
                break;

            case CallbackAction.CHANGE_GROUP:
                await handleChangeGroup(ctx);
                break;

            case CallbackAction.CONFIRM_CHANGE_GROUP:
                await handleConfirmChangeGroup(ctx);
                break;

            case CallbackAction.CANCEL_ACTION:
                await handleCancelAction(ctx);
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

// Обработка завершения смены группы
async function handleGroupChangeComplete(ctx: BotContext, newGroupId: number): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить чат');
        return;
    }

    try {
        await ctx.answerCallbackQuery('⏳ Меняем группу...');

        const externalChatId = chatId.toString();

        logger.info('Completing group change', {
            userId: ctx.from?.id,
            externalChatId,
            newGroupId,
        });

        // Проверяем, существует ли чат в БД
        const existingChat = await getChatByExternalId(externalChatId);

        if (!existingChat) {
            await ctx.answerCallbackQuery('❌ Ошибка: чат не найден в БД');
            await ctx.reply(
                '❌ Произошла ошибка. Попробуйте сначала зарегистрироваться через /start'
            );

            // Очищаем сессию
            ctx.session.settings = undefined;
            ctx.session.selectedDepartmentId = undefined;
            ctx.session.selectedCourse = undefined;
            ctx.session.selectedGroupId = undefined;

            return;
        }

        const existingSubscribers = await countChatsByGroupId(newGroupId);
        const shouldTriggerParser = existingSubscribers === 0;

        // Меняем группу в БД
        await changeGroup(externalChatId, newGroupId);
        const newGroup = await getGroupById(newGroupId);

        if (shouldTriggerParser) {
            await triggerGroupParsing(newGroupId);
        }

        // Удаляем предыдущее сообщение
        await ctx.deleteMessage();

        // Отправляем подтверждение
        const message = MESSAGES.SETTINGS.GROUP_CHANGED.replace('{groupName}', newGroup.name);

        await ctx.reply(message, { parse_mode: 'Markdown' });

        // Предлагаем посмотреть расписание
        await ctx.reply(
            '📅 Хотите посмотреть расписание новой группы?\n\n' +
            'Используйте команду /schedule'
        );

        ctx.session.shouldSendSchedule = false;

        // Очищаем временные данные сессии
        ctx.session.settings = undefined;
        ctx.session.selectedDepartmentId = undefined;
        ctx.session.selectedCourse = undefined;
        ctx.session.selectedGroupId = undefined;
        ctx.session.currentPage = undefined;

        logger.info('Group changed successfully', {
            userId: ctx.from?.id,
            chatId: existingChat.chatid,
            oldGroupId: existingChat.groupid,
            newGroupId,
            newGroupName: newGroup.name,
        });
    } catch (error) {
        logger.error('Failed to complete group change', {
            error,
            newGroupId,
            userId: ctx.from?.id,
        });

        await ctx.reply(
            '❌ Не удалось изменить группу. Попробуйте еще раз позже или используйте /settings'
        );

        // Очищаем сессию при ошибке
        ctx.session.shouldSendSchedule = false;
        ctx.session.settings = undefined;
    }
}