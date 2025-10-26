// src/services/notification.service.ts
// Notification sending service

import { Bot } from 'grammy';
import { logger } from '../utils/logger.js';
import { getDayScheduleForGroup, getWeekScheduleForGroup } from './schedule.service.js';
import { getGroupById } from './database.service.js';
import { getCurrentWeekType } from '../utils/week-calculator.js';
import { format, addDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { EMOJI } from '../config/constants.js';
import type { DaySchedule, LessonDisplay, WeekType, BotContext } from '../types';
import * as notifyRepo from '../repositories/notify.repository.js';
import * as lessonRepo from '../repositories/lesson.repository.js';

interface NotificationData {
    notifyId: number;
    chatId: number;
    externalChatId: string;
    lessonId: number | null;
    groupId: number;
}

export class NotificationService {
    constructor(private bot: Bot<BotContext>) {}

    async sendPendingNotifications(): Promise<void> {
        try {
            const pending = await notifyRepo.getPendingNotifications(50);

            if (pending.length === 0) {
                logger.debug('No pending notifications to send');
                return;
            }

            logger.info('Processing pending notifications', { count: pending.length });

            for (const notification of pending) {
                try {
                    await this.sendNotification(notification);
                    await notifyRepo.markNotificationAsSent(notification.notifyid);
                } catch (error) {
                    logger.error('Failed to send notification', {
                        notifyId: notification.notifyid,
                        error
                    });
                }
            }

            logger.info('Finished processing notifications', { processed: pending.length });
        } catch (error) {
            logger.error('Failed to process pending notifications', { error });
        }
    }

    private async sendNotification(notification: any): Promise<void> {
        const chat = await this.getChatDetails(notification.chatid);
        if (!chat) {
            logger.warn('Chat not found for notification', { notifyId: notification.notifyid });
            return;
        }

        const group = await getGroupById(chat.groupid);

        if (notification.lessonid) {
            // Send notification for specific lesson
            await this.sendLessonNotification(
                chat.externalchatid,
                notification.lessonid,
                group.name
            );
        } else {
            // Send daily schedule notification
            await this.sendDailyScheduleNotification(
                chat.externalchatid,
                chat.groupid,
                group.name
            );
        }
    }

    private async sendLessonNotification(
        externalChatId: string,
        lessonId: number,
        groupName: string
    ): Promise<void> {
        const lesson = await lessonRepo.getLessonById(lessonId);

        if (!lesson) {
            logger.warn('Lesson not found for notification', { lessonId });
            return;
        }

        const message = this.buildLessonNotificationMessage(lesson, groupName);

        try {
            await this.bot.api.sendMessage(externalChatId, message);
            logger.info('Lesson notification sent', { externalChatId, lessonId });
        } catch (error) {
            logger.error('Failed to send lesson notification', {
                externalChatId,
                lessonId,
                error
            });
            throw error;
        }
    }

    private async sendDailyScheduleNotification(
        externalChatId: string,
        groupId: number,
        groupName: string
    ): Promise<void> {
        const today = startOfDay(new Date());
        const schedule = await getDayScheduleForGroup(groupId, today);

        const message = this.buildDailyScheduleMessage(schedule, groupName, today);

        try {
            await this.bot.api.sendMessage(externalChatId, message);
            logger.info('Daily schedule notification sent', { externalChatId, groupId });
        } catch (error) {
            logger.error('Failed to send daily notification', {
                externalChatId,
                groupId,
                error
            });
            throw error;
        }
    }

    private buildLessonNotificationMessage(lesson: any, groupName: string): string {
        const lines = [
            `${EMOJI.BELL} Напоминание о паре`,
            ``,
            `${EMOJI.GROUP} Группа: ${groupName}`,
            `${EMOJI.CLOCK} Время: ${lesson.starttime.slice(0, 5)} - ${lesson.endtime.slice(0, 5)}`,
            `${EMOJI.BOOK} Предмет: ${lesson.name}`,
        ];

        if (lesson.teachername) {
            lines.push(`${EMOJI.TEACHER} Преподаватель: ${lesson.teachername}`);
        }

        if (lesson.cabinetnumber) {
            lines.push(`${EMOJI.ROOM} Аудитория: ${lesson.cabinetnumber}`);
        }

        return lines.join('\n');
    }

    private buildDailyScheduleMessage(
        schedule: DaySchedule,
        groupName: string,
        date: Date
    ): string {
        const header = [
            `${EMOJI.BELL} Доброе утро!`,
            ``,
            `${EMOJI.GROUP} Группа: ${groupName}`,
            `${EMOJI.CALENDAR} ${schedule.dayName}, ${format(date, 'd MMMM', { locale: ru })}`,
            ``,
        ];

        if (schedule.lessons.length === 0) {
            return [...header, '📭 Сегодня занятий нет. Можно отдохнуть!'].join('\n');
        }

        const lessonsText = schedule.lessons.map((lesson, index) => {
            const lines = [
                `${index + 1}. ${lesson.startTime}–${lesson.endTime} — ${lesson.name}`,
            ];

            if (lesson.teacher) {
                lines.push(`   ${EMOJI.TEACHER} ${lesson.teacher}`);
            }

            if (lesson.cabinet) {
                lines.push(`   ${EMOJI.ROOM} ${lesson.cabinet}`);
            }

            return lines.join('\n');
        }).join('\n\n');

        return [
            ...header,
            `Расписание на сегодня:`,
            ``,
            lessonsText,
            ``,
            `Удачного дня! ${EMOJI.CHECK}`,
        ].join('\n');
    }

    private async getChatDetails(chatId: number): Promise<{
        externalchatid: string;
        groupid: number;
    } | null> {
        try {
            const [chat] = await import('../config/database.js').then(m => m.db<Array<{
                externalchatid: string;
                groupid: number;
            }>>`
                SELECT externalchatid, groupid
                FROM Chat
                WHERE chatid = ${chatId}
            `);

            return chat ?? null;
        } catch (error) {
            logger.error('Failed to get chat details', { chatId, error });
            return null;
        }
    }
}

export async function scheduleNotificationsForToday(bot: Bot<BotContext>): Promise<void> {
    try {
        const chats = await notifyRepo.getChatsWithNotificationsEnabled();
        logger.info('Scheduling notifications for today', { chatsCount: chats.length });

        const today = startOfDay(new Date());
        const tomorrow = addDays(today, 1);

        for (const chat of chats) {
            try {
                // Parse notification time (format: "HH:MM:SS")
                const [hours, minutes] = chat.notificationtime.split(':').map(Number);
                const scheduledTime = new Date(today);
                scheduledTime.setHours(hours ?? 0, minutes ?? 0, 0, 0);

                // Only schedule if time hasn't passed today
                if (scheduledTime > new Date()) {
                    if (chat.notifyoneverylesson) {
                        // Schedule notification for each lesson
                        const schedule = await getDayScheduleForGroup(chat.groupid, today);

                        for (const lesson of schedule.lessons) {
                            const [lessonHours, lessonMinutes] = lesson.startTime.split(':').map(Number);
                            const lessonTime = new Date(today);
                            lessonTime.setHours(lessonHours ?? 0, lessonMinutes ?? 0, 0, 0);

                            // Schedule notification 15 minutes before lesson
                            const notifyTime = new Date(lessonTime.getTime() - 15 * 60 * 1000);

                            if (notifyTime > new Date()) {
                                // Would need lessonid from actual lesson data
                                // await notifyRepo.createNotification(chat.chatid, notifyTime, lessonId);
                            }
                        }
                    } else {
                        // Schedule single morning notification
                        await notifyRepo.createNotification(chat.chatid, scheduledTime);
                    }
                }
            } catch (error) {
                logger.error('Failed to schedule notification for chat', {
                    chatId: chat.chatid,
                    error
                });
            }
        }

        logger.info('Notifications scheduling complete');
    } catch (error) {
        logger.error('Failed to schedule notifications', { error });
    }
}
