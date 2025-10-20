// src/services/settings.service.ts
// Бизнес-логика для настроек

import { updateChat, getChatByExternalId } from './database.service.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../types';
import type { Chat, UpdateChat } from '../types';

export async function toggleNotifications(externalChatId: string): Promise<Chat> {
    const chat = await getChatByExternalId(externalChatId);

    if (!chat) {
        throw new NotFoundError('Chat', { externalChatId });
    }

    const updates: UpdateChat = {
        isnotificationenabled: !chat.isnotificationenabled,
    };

    const updatedChat = await updateChat(chat.chatid, updates);

    logger.info('Notifications toggled', {
        chatId: chat.chatid,
        enabled: updatedChat.isnotificationenabled,
    });

    return updatedChat;
}

export async function toggleEveryLessonNotification(externalChatId: string): Promise<Chat> {
    const chat = await getChatByExternalId(externalChatId);

    if (!chat) {
        throw new NotFoundError('Chat', { externalChatId });
    }

    const updates: UpdateChat = {
        notifyoneverylesson: !chat.notifyoneverylesson,
    };

    const updatedChat = await updateChat(chat.chatid, updates);

    logger.info('Every lesson notification toggled', {
        chatId: chat.chatid,
        enabled: updatedChat.notifyoneverylesson,
    });

    return updatedChat;
}

export async function changeNotificationTime(
    externalChatId: string,
    newTime: string
): Promise<Chat> {
    const chat = await getChatByExternalId(externalChatId);

    if (!chat) {
        throw new NotFoundError('Chat', { externalChatId });
    }

    // Валидация формата времени
    if (!/^\d{2}:\d{2}:\d{2}$/.test(newTime)) {
        throw new Error('Invalid time format. Expected HH:MM:SS');
    }

    const updates: UpdateChat = {
        notificationtime: newTime,
    };

    const updatedChat = await updateChat(chat.chatid, updates);

    logger.info('Notification time changed', {
        chatId: chat.chatid,
        newTime,
    });

    return updatedChat;
}

export async function changeGroup(
    externalChatId: string,
    newGroupId: number
): Promise<Chat> {
    const chat = await getChatByExternalId(externalChatId);

    if (!chat) {
        throw new NotFoundError('Chat', { externalChatId });
    }

    const updates: UpdateChat = {
        groupid: newGroupId,
    };

    const updatedChat = await updateChat(chat.chatid, updates);

    logger.info('Group changed', {
        chatId: chat.chatid,
        oldGroupId: chat.groupid,
        newGroupId,
    });

    return updatedChat;
}

export function formatNotificationStatus(chat: Chat): string {
    const status = chat.isnotificationenabled ? '✅ Включены' : '🔕 Отключены';
    const time = chat.notificationtime.slice(0, 5);
    const everyLesson = chat.notifyoneverylesson ? '✅ Да' : '❌ Нет';

    return `${status}\n⏰ Время: ${time}\n📬 На каждый урок: ${everyLesson}`;
}