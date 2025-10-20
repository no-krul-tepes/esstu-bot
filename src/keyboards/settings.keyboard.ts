// src/keyboards/settings.keyboard.ts
// Клавиатуры для меню настроек

import { InlineKeyboard } from 'grammy';
import { CallbackAction } from '../types';
import { NOTIFICATION_TIME_OPTIONS, EMOJI } from '../config/constants.js';
import type { Chat, Group } from '../types';

export function createSettingsMainKeyboard(
    chat: Chat,
    group: Group
): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    // Информация о группе
    keyboard.text(
        `${EMOJI.GROUP} Сменить группу`,
        CallbackAction.CHANGE_GROUP
    );
    keyboard.row();

    // Управление уведомлениями
    const notifyIcon = chat.isnotificationenabled ? '🔔' : '🔕';
    const notifyText = chat.isnotificationenabled
        ? 'Отключить уведомления'
        : 'Включить уведомления';

    keyboard.text(
        `${notifyIcon} ${notifyText}`,
        CallbackAction.TOGGLE_NOTIFICATIONS
    );
    keyboard.row();

    // Время уведомлений (если уведомления включены)
    if (chat.isnotificationenabled) {
        keyboard.text(
            `${EMOJI.CLOCK} Изменить время (${chat.notificationtime.slice(0, 5)})`,
            CallbackAction.CHANGE_NOTIFICATION_TIME
        );
        keyboard.row();

        // Уведомления на каждый урок
        const everyLessonIcon = chat.notifyoneverylesson ? '✅' : '📬';
        const everyLessonText = chat.notifyoneverylesson
            ? 'Только утренние уведомления'
            : 'Уведомлять о каждом уроке';

        keyboard.text(
            `${everyLessonIcon} ${everyLessonText}`,
            CallbackAction.TOGGLE_EVERY_LESSON
        );
        keyboard.row();
    }

    // Кнопка "Назад"
    keyboard.text(`${EMOJI.BACK} Закрыть`, CallbackAction.CANCEL_ACTION);

    return keyboard;
}

export function createChangeGroupConfirmKeyboard(): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    keyboard.text(
        '✅ Да, сменить группу',
        CallbackAction.CONFIRM_CHANGE_GROUP
    );
    keyboard.row();

    keyboard.text(
        `${EMOJI.BACK} Отмена`,
        CallbackAction.CANCEL_ACTION
    );

    return keyboard;
}

export function createNotificationTimeKeyboard(): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    // Добавляем кнопки времени по 2 в ряд
    for (let i = 0; i < NOTIFICATION_TIME_OPTIONS.length; i += 2) {
        const option1 = NOTIFICATION_TIME_OPTIONS[i];
        const option2 = NOTIFICATION_TIME_OPTIONS[i + 1];

        if (option1) {
            keyboard.text(
                option1.label,
                `${CallbackAction.SET_NOTIFICATION_TIME}:${option1.value}`
            );
        }

        if (option2) {
            keyboard.text(
                option2.label,
                `${CallbackAction.SET_NOTIFICATION_TIME}:${option2.value}`
            );
        }

        keyboard.row();
    }

    // Кнопка "Назад"
    keyboard.text(`${EMOJI.BACK} Назад`, CallbackAction.CANCEL_ACTION);

    return keyboard;
}