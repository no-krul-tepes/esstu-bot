// src/keyboards/navigation.keyboard.ts
// Генераторы inline клавиатур для навигации

import { InlineKeyboard } from 'grammy';
import { APP_CONFIG, EMOJI, COURSES } from '../config/constants.js';
import { CallbackAction } from '../types';
import type { Department, Group } from '../types';
import type { PaginatedResult } from '../types';

export function createTermsKeyboard(): InlineKeyboard {
    return new InlineKeyboard().text(
        `${EMOJI.CHECK} Согласиться`,
        `${CallbackAction.AGREE_TERMS}`
    );
}

export function createDepartmentsKeyboard(departments: Department[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    const buttonsPerRow = 1;

    for (let i = 0; i < departments.length; i += buttonsPerRow) {
        const row = departments.slice(i, i + buttonsPerRow);

        for (const dept of row) {
            keyboard.text(
                dept.name,
                `${CallbackAction.SELECT_DEPARTMENT}:${dept.departmentid}`
            );
        }

        keyboard.row();
    }

    return keyboard;
}

export function createCoursesKeyboard(): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    const coursesPerRow = 3;

    for (let i = 0; i < COURSES.length; i += coursesPerRow) {
        const row = COURSES.slice(i, i + coursesPerRow);

        for (const course of row) {
            keyboard.text(
                `${course} курс`,
                `${CallbackAction.SELECT_COURSE}:${course}`
            );
        }

        keyboard.row();
    }

    // Кнопка "Назад"
    keyboard.text(`${EMOJI.BACK} Назад`, CallbackAction.NAVIGATE_BACK);

    return keyboard;
}

export function createGroupsKeyboard(
    paginatedGroups: PaginatedResult<Group>,
): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    const { items: groups, pagination, hasNext, hasPrev } = paginatedGroups;

    const buttonsPerRow = Math.max(1, APP_CONFIG.BUTTONS_PER_ROW);

    for (let i = 0; i < groups.length; i += buttonsPerRow) {
        const row = groups.slice(i, i + buttonsPerRow);

        for (const group of row) {
            keyboard.text(
                group.name,
                `${CallbackAction.SELECT_GROUP}:${group.groupid}`
            );
        }

        keyboard.row();
    }

    // Навигация по страницам
    if (pagination.totalPages > 1) {
        const navRow: Array<{ text: string; callbackData: string }> = [];

        if (hasPrev) {
            navRow.push({
                text: `${EMOJI.PREV} Назад`,
                callbackData: `${CallbackAction.NAVIGATE_PREV}:${pagination.currentPage - 1}`,
            });
        }

        // Индикатор страницы
        navRow.push({
            text: `${pagination.currentPage + 1}/${pagination.totalPages}`,
            callbackData: 'noop', // Non-operational callback
        });

        if (hasNext) {
            navRow.push({
                text: `${EMOJI.NEXT} Далее`,
                callbackData: `${CallbackAction.NAVIGATE_NEXT}:${pagination.currentPage + 1}`,
            });
        }

        for (const button of navRow) {
            keyboard.text(button.text, button.callbackData);
        }
        keyboard.row();
    }

    // Кнопка "Назад" к выбору курса
    keyboard.text(`${EMOJI.BACK} Назад`, CallbackAction.NAVIGATE_BACK);

    return keyboard;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createBackKeyboard(): InlineKeyboard {
    return new InlineKeyboard().text(
        `${EMOJI.BACK} Вернуться`,
        CallbackAction.NAVIGATE_BACK
    );
}