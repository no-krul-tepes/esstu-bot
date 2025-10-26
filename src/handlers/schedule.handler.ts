// src/handlers/schedule.handler.ts
// Обработчик отображения расписания

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { logger } from '../utils/logger.js';
import { getChatByExternalId, getGroupById } from '../services/database.service.js';
import { getWeekScheduleForGroup, hasLessonsInSchedule } from '../services/schedule.service.js';
import { getCurrentWeekType } from '../utils/week-calculator.js';
import { EMOJI } from '../config/constants.js';
import type { BotContext, DaySchedule, LessonDisplay, WeekType } from '../types';

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

        const schedule = await getWeekScheduleForGroup(group.groupid);

        if (!hasLessonsInSchedule(schedule)) {
            await ctx.api.editMessageText(
                ctx.chat.id,
                loadingMessage.message_id,
                `${EMOJI.CALENDAR} Расписание для группы ${group.name}\n\n` +
                '📭 На этой неделе нет занятий.'
            );
            return;
        }

        const weekType = getCurrentWeekType();
        const scheduleText = buildScheduleMessage({
            groupName: group.name,
            weekType,
            schedule,
        });

        await ctx.api.editMessageText(
            ctx.chat.id,
            loadingMessage.message_id,
            scheduleText
        );

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

interface ScheduleMessageParams {
    groupName: string;
    weekType: WeekType;
    schedule: DaySchedule[];
}

const LESSON_NUMBER_EMOJI: Record<number, string> = {
    0: '0️⃣',
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    9: '9️⃣',
    10: '🔟',
};

function buildScheduleMessage({ groupName, weekType, schedule }: ScheduleMessageParams): string {
    const weekLabel = formatWeekTypeLabel(weekType);

    const daysText = schedule.map(formatDaySection).join('\n\n');

    return [
        `${EMOJI.CALENDAR} Расписание для группы ${groupName}`,
        `Неделя: ${weekLabel}`,
        '',
        daysText,
    ].filter(Boolean).join('\n').trim();
}

function formatWeekTypeLabel(weekType: WeekType): string {
    return weekType === 'even' ? 'Чётная неделя' : 'Нечётная неделя';
}

function formatDaySection(day: DaySchedule): string {
    const header = `📆 ${day.dayName}, ${format(day.date, 'd MMMM', { locale: ru })}`;

    if (day.lessons.length === 0) {
        return `${header}\n   • Занятий нет`;
    }

    const lessonsText = day.lessons.map(formatLessonLine).join('\n');

    return `${header}\n${lessonsText}`;
}

function formatLessonLine(lesson: LessonDisplay): string {
    const lessonType = formatLessonTypeLabel(lesson.type);
    const lines = [
        `   ${formatLessonNumberEmoji(lesson.number)} ${lesson.startTime}–${lesson.endTime} — ${lesson.name}${lessonType ? ` (${lessonType})` : ''}`,
    ];

    if (lesson.teacher) {
        lines.push(`      ${EMOJI.TEACHER} ${lesson.teacher}`);
    }

    if (lesson.cabinet) {
        lines.push(`      ${EMOJI.ROOM} ${lesson.cabinet}`);
    }

    return lines.join('\n');
}

function formatLessonNumberEmoji(number: number): string {
    return LESSON_NUMBER_EMOJI[number] ?? `${number}.`;
}

function formatLessonTypeLabel(type: string | null): string | null {
    if (!type) {
        return null;
    }

    const normalized = type.trim().toLowerCase();
    const dictionary: Record<string, string> = {
        lecture: 'Лекция',
        practice: 'Практика',
        practicum: 'Практика',
        laboratory: 'Лабораторная',
        lab: 'Лабораторная',
        seminar: 'Семинар',
        exam: 'Экзамен',
        consultation: 'Консультация',
        webinar: 'Вебинар',
    };

    return dictionary[normalized] ?? capitalize(type.trim());
}

function capitalize(value: string): string {
    if (!value) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
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