import { deleteChat, getChatByExternalId } from '../services/database.service.js';
import { resetSession } from '../middleware/session.middleware.js';
import { logger } from '../utils/logger.js';
import type { BotContext } from '../types';

export async function handleUnsubscribe(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
        await ctx.reply('❌ Ошибка: не удалось определить чат');
        return;
    }

    const externalChatId = chatId.toString();

    try {
        const chat = await getChatByExternalId(externalChatId);

        if (!chat) {
            await ctx.reply('ℹ️ Вы ещё не зарегистрированы.');
            return;
        }

        await deleteChat(chat.chatid);
        resetSession(ctx);

        logger.info('Chat unsubscribed', {
            userId: ctx.from?.id,
            chatId: chat.chatid,
            externalChatId,
        });

        await ctx.reply('✅ Подписка отключена. Все данные удалены.');
    } catch (error) {
        logger.error('Failed to handle unsubscribe command', { externalChatId, error });
        await ctx.reply('⚠️ Не удалось выполнить отписку. Попробуйте позже.');
    }
}
