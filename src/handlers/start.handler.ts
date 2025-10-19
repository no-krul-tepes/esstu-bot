// src/handlers/start.handler.ts
// Обработчик команды /start

import { GrammyError } from 'grammy';
import { MESSAGES } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { resetSession, updateSessionStep, setSelectedGroup } from '../middleware/session.middleware.js';
import { RegistrationStep } from '../types';
import { createTermsKeyboard } from '../keyboards/navigation.keyboard.js';
import { getChatByExternalId } from '../services/database.service.js';
import type { BotContext } from '../types';

export async function handleStart(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;

    logger.info('Start command received', { userId, username });

    resetSession(ctx);

    await ctx.reply(
        `${MESSAGES.START.TITLE}\n\n${MESSAGES.START.DESCRIPTION}`,
        { parse_mode: 'Markdown' }
    );

    const chatId = ctx.chat?.id?.toString() ?? null;

    // Непосредственно ждём результат getChatByExternalId, чтобы не было "Missing await"
    const existingChat = chatId
        ? await getChatByExternalId(chatId)
        : null;

    const termsMessage = await ctx.reply(MESSAGES.TERMS.TEXT, {
        parse_mode: 'Markdown',
        reply_markup: createTermsKeyboard(),
    });

    try {
        if (existingChat && chatId) {
            setSelectedGroup(ctx, existingChat.groupid);
            ctx.session.agreedToTerms = true;
            updateSessionStep(ctx, RegistrationStep.COMPLETED);

            const chatIdentifier = termsMessage.chat.id;
            const messageId = termsMessage.message_id;

            const updateText = async (): Promise<boolean> => {
                try {
                    await ctx.api.editMessageText(
                        chatIdentifier,
                        messageId,
                        '✅ Вы уже зарегистрированы!\n\nИспользуйте /schedule для просмотра расписания.'
                    );
                    return true;
                } catch (textError) {
                    if (!isNotModifiedError(textError)) {
                        throw textError;
                    }

                    logger.debug('Terms message text already updated', {
                        chatId,
                        messageId,
                    });

                    return false;
                }
            };

            const updateMarkup = async (): Promise<void> => {
                try {
                    await ctx.api.editMessageReplyMarkup(
                        chatIdentifier,
                        messageId,
                        undefined
                    );
                } catch (markupError) {
                    if (!isNotModifiedError(markupError)) {
                        throw markupError;
                    }

                    logger.debug('Reply markup already removed', {
                        chatId,
                        messageId,
                    });
                }
            };

            await updateMarkup();
            const textChanged = await updateText();

            if (textChanged) {
                logger.debug('Existing chat terms message updated', {
                    userId,
                    chatId,
                });
            }

            logger.debug('Existing chat detected on start', {
                userId,
                chatId,
                groupId: existingChat.groupid,
            });

            logger.debug('Start handler completed', { userId });
            return;
        }
    } catch (error) {
        if (isNotModifiedError(error)) {
            logger.debug('Terms message already adjusted for existing chat', {
                chatId,
            });
            return;
        }

        logger.error('Failed to check existing chat on start', { chatId, error });
        return;
    }

    updateSessionStep(ctx, RegistrationStep.TERMS_AGREEMENT);

    logger.debug('Start handler completed', { userId });
}

function isNotModifiedError(error: unknown): boolean {
    return (
        error instanceof GrammyError &&
        error.description === 'Bad Request: message is not modified'
    );
}