// src/repositories/chat.repository.ts
// Repository для работы с таблицей Chat

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../types/errors.js';
import type { Chat, CreateChat, UpdateChat } from '../types/database.js';

export async function createChat(chatData: CreateChat): Promise<Chat> {
    try {
        const [chat] = await db<Chat[]>`
      INSERT INTO Chat (
        groupid,
        name,
        externalchatid,
        notificationtime,
        isnotificationenabled,
        notifyoneverylesson
      ) VALUES (
        ${chatData.groupid},
        ${chatData.name},
        ${chatData.externalchatid},
        ${chatData.notificationtime},
        ${chatData.isnotificationenabled},
        ${chatData.notifyoneverylesson}
      )
      RETURNING 
        chatid,
        groupid,
        name,
        externalchatid,
        notificationtime,
        isnotificationenabled,
        notifyoneverylesson,
        dateadded
    `;

        if (!chat) {
            throw new DatabaseError('Failed to create chat: no data returned');
        }

        logger.info('Chat created', { chatId: chat.chatid, externalChatId: chat.externalchatid });
        return chat;
    } catch (error) {
        logger.error('Failed to create chat', { chatData, error });
        throw new DatabaseError('Failed to create chat', { chatData, error });
    }
}

export async function getChatByExternalId(externalChatId: string): Promise<Chat | null> {
    try {
        const [chat] = await db<Chat[]>`
      SELECT 
        chatid,
        groupid,
        name,
        externalchatid,
        notificationtime,
        isnotificationenabled,
        notifyoneverylesson,
        dateadded
      FROM Chat
      WHERE externalchatid = ${externalChatId}
    `;

        return chat ?? null;
    } catch (error) {
        logger.error('Failed to fetch chat by external ID', { externalChatId, error });
        throw new DatabaseError('Failed to fetch chat', { externalChatId, error });
    }
}

export async function getChatById(chatId: number): Promise<Chat> {
    try {
        const [chat] = await db<Chat[]>`
      SELECT 
        chatid,
        groupid,
        name,
        externalchatid,
        notificationtime,
        isnotificationenabled,
        notifyoneverylesson,
        dateadded
      FROM Chat
      WHERE chatid = ${chatId}
    `;

        if (!chat) {
            throw new NotFoundError('Chat', { chatId });
        }

        return chat;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error('Failed to fetch chat', { chatId, error });
        throw new DatabaseError('Failed to fetch chat', { chatId, error });
    }
}

export async function updateChat(chatId: number, updates: UpdateChat): Promise<Chat> {
    try {
        // Строим динамический UPDATE запрос
        if (updates.groupid !== undefined) {
            const [chat] = await db<Chat[]>`
        UPDATE Chat
        SET groupid = ${updates.groupid},
            name = COALESCE(${updates.name ?? null}, name),
            notificationtime = COALESCE(${updates.notificationtime ?? null}, notificationtime),
            isnotificationenabled = COALESCE(${updates.isnotificationenabled ?? null}, isnotificationenabled),
            notifyoneverylesson = COALESCE(${updates.notifyoneverylesson ?? null}, notifyoneverylesson)
        WHERE chatid = ${chatId}
        RETURNING 
          chatid,
          groupid,
          name,
          externalchatid,
          notificationtime,
          isnotificationenabled,
          notifyoneverylesson,
          dateadded
      `;

            if (!chat) {
                throw new NotFoundError('Chat', { chatId });
            }

            logger.info('Chat updated', { chatId, updates });
            return chat;
        }

        // Если groupid не указан, обновляем только остальные поля
        const [chat] = await db<Chat[]>`
      UPDATE Chat
      SET name = COALESCE(${updates.name ?? null}, name),
          notificationtime = COALESCE(${updates.notificationtime ?? null}, notificationtime),
          isnotificationenabled = COALESCE(${updates.isnotificationenabled ?? null}, isnotificationenabled),
          notifyoneverylesson = COALESCE(${updates.notifyoneverylesson ?? null}, notifyoneverylesson)
      WHERE chatid = ${chatId}
      RETURNING 
        chatid,
        groupid,
        name,
        externalchatid,
        notificationtime,
        isnotificationenabled,
        notifyoneverylesson,
        dateadded
    `;

        if (!chat) {
            throw new NotFoundError('Chat', { chatId });
        }

        logger.info('Chat updated', { chatId, updates });
        return chat;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error('Failed to update chat', { chatId, updates, error });
        throw new DatabaseError('Failed to update chat', { chatId, error });
    }
}

export async function deleteChat(chatId: number): Promise<void> {
    try {
        await db`
      DELETE FROM Chat
      WHERE chatid = ${chatId}
    `;

        logger.info('Chat deleted', { chatId });
    } catch (error) {
        logger.error('Failed to delete chat', { chatId, error });
        throw new DatabaseError('Failed to delete chat', { chatId, error });
    }
}

export async function chatExistsByExternalId(externalChatId: string): Promise<boolean> {
    try {
        const [result] = await db<[{ exists: boolean }]>`
      SELECT EXISTS(
        SELECT 1 FROM Chat WHERE externalchatid = ${externalChatId}
      ) as exists
    `;

        return result?.exists ?? false;
    } catch (error) {
        logger.error('Failed to check chat existence', { externalChatId, error });
        throw new DatabaseError('Failed to check chat existence', { externalChatId, error });
    }
}