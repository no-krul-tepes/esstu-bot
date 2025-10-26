// src/repositories/notify.repository.ts
// Repository for NotifyQueue table operations

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../types';
import type { NotifyQueue } from '../types';

export async function getPendingNotifications(limit: number = 100): Promise<NotifyQueue[]> {
    try {
        const now = new Date();
        const notifications = await db<NotifyQueue[]>`
            SELECT
                notifyid,
                chatid,
                lessonid,
                scheduledtime,
                issent,
                createdat,
                sentat
            FROM NotifyQueue
            WHERE issent = false
              AND scheduledtime <= ${now}
            ORDER BY scheduledtime ASC
            LIMIT ${limit}
        `;

        logger.debug('Fetched pending notifications', { count: notifications.length });
        return notifications;
    } catch (error) {
        logger.error('Failed to fetch pending notifications', { error });
        throw new DatabaseError('Failed to fetch pending notifications', { error });
    }
}

export async function markNotificationAsSent(notifyId: number): Promise<void> {
    try {
        const now = new Date();
        await db`
            UPDATE NotifyQueue
            SET issent = true,
                sentat = ${now}
            WHERE notifyid = ${notifyId}
        `;

        logger.debug('Notification marked as sent', { notifyId });
    } catch (error) {
        logger.error('Failed to mark notification as sent', { notifyId, error });
        throw new DatabaseError('Failed to mark notification as sent', { notifyId, error });
    }
}

export async function createNotification(
    chatId: number,
    scheduledTime: Date,
    lessonId?: number
): Promise<NotifyQueue> {
    try {
        const [notification] = await db<NotifyQueue[]>`
            INSERT INTO NotifyQueue (
                chatid,
                lessonid,
                scheduledtime,
                issent
            ) VALUES (
                ${chatId},
                ${lessonId ?? null},
                ${scheduledTime},
                false
            )
            RETURNING
                notifyid,
                chatid,
                lessonid,
                scheduledtime,
                issent,
                createdat,
                sentat
        `;

        if (!notification) {
            throw new DatabaseError('Failed to create notification: no data returned');
        }

        logger.info('Notification created', { notifyId: notification.notifyid, chatId });
        return notification;
    } catch (error) {
        logger.error('Failed to create notification', { chatId, scheduledTime, error });
        throw new DatabaseError('Failed to create notification', { error });
    }
}

export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await db<[{ count: string }]>`
            DELETE FROM NotifyQueue
            WHERE issent = true
              AND sentat < ${cutoffDate}
            RETURNING COUNT(*)::text as count
        `;

        const count = parseInt(result[0]?.count ?? '0', 10);
        logger.info('Old notifications deleted', { count, daysOld });
        return count;
    } catch (error) {
        logger.error('Failed to delete old notifications', { daysOld, error });
        throw new DatabaseError('Failed to delete old notifications', { error });
    }
}

export async function getChatsWithNotificationsEnabled(): Promise<Array<{
    chatid: number;
    externalchatid: string;
    groupid: number;
    notificationtime: string;
    notifyoneverylesson: boolean;
}>> {
    try {
        const chats = await db<Array<{
            chatid: number;
            externalchatid: string;
            groupid: number;
            notificationtime: string;
            notifyoneverylesson: boolean;
        }>>`
            SELECT
                chatid,
                externalchatid,
                groupid,
                notificationtime,
                notifyoneverylesson
            FROM Chat
            WHERE isnotificationenabled = true
            ORDER BY notificationtime ASC
        `;

        logger.debug('Fetched chats with notifications enabled', { count: chats.length });
        return chats;
    } catch (error) {
        logger.error('Failed to fetch chats with notifications', { error });
        throw new DatabaseError('Failed to fetch chats with notifications', { error });
    }
}
