// src/handlers/schedule.handler.ts
// Обработчик отображения расписания

import { InputFile } from 'grammy';
import { logger } from '../utils/logger.js';
import { getChatByExternalId, getGroupById } from '../services/database.service.js';
import { getWeekScheduleForGroup, hasLessonsInSchedule } from '../services/schedule.service.js';
import { generateScheduleImage } from '../utils/image-generator.js';
import { getCurrentWeekType } from '../utils/week-calculator.js';
import { EMOJI } from '../config/constants.js';
import type { BotContext } from '../types';

export async function handleSchedule(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.reply('❌ Ошибка: не удалось определить чат');
        return;
    }

    try {
        const externalChatId = chatId.toString();

        // Проверяем, зарегистрирован ли чат
        const chat = await getChatByExternalId(externalChatId);

        if (!chat) {
            await ctx.reply(
                '❌ Вы не зарегистрированы!\n\n' +
                'Используйте команду /start для регистрации.'
            );
            return;
        }

        // Получаем информацию о группе
        const group = await getGroupById(chat.groupid);

        logger.info('Generating schedule', {
            userId: ctx.from?.id,
            chatId: chat.chatid,
            groupId: group.groupid,
            groupName: group.name
        });

        // Отправляем сообщение о загрузке
        const loadingMessage = await ctx.reply(
            `${EMOJI.CALENDAR} Загружаю расписание для группы ${group.name}...`
        );

        // Получаем расписание на неделю
        const schedule = await getWeekScheduleForGroup(group.groupid);

        // Проверяем, есть ли уроки
        if (!hasLessonsInSchedule(schedule)) {
            await ctx.api.editMessageText(
                ctx.chat.id,
                loadingMessage.message_id,
                `${EMOJI.CALENDAR} Расписание для группы ${group.name}\n\n` +
                '📭 На этой неделе нет занятий.'
            );
            return;
        }

        // Генерируем изображение
        const weekType = getCurrentWeekType();
        const imageBuffer = await generateScheduleImage({
            groupName: group.name,
            weekType,
            lessons: schedule,
            generatedAt: new Date(),
        });

        // Отправляем изображение
        await ctx.replyWithPhoto(new InputFile(imageBuffer), {
            caption: `${EMOJI.CALENDAR} Расписание для группы ${group.name}`,
        });

        // Удаляем сообщение о загрузке
        await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);

        logger.info('Schedule sent successfully', {
            userId: ctx.from?.id,
            chatId: chat.chatid,
            groupId: group.groupid
        });

    } catch (error) {
        logger.error('Failed to handle schedule command', { error });
        throw error;
    }
}

// Автоматическая отправка расписания после регистрации
export async function sendScheduleAfterRegistration(ctx: BotContext): Promise<void> {
    try {
        await handleSchedule(ctx);
    } catch (error) {
        logger.error('Failed to send schedule after registration', { error });
        await ctx.reply(
            '⚠️ Не удалось загрузить расписание.\n\n' +
            'Попробуйте позже командой /schedule'
        );
    }
}