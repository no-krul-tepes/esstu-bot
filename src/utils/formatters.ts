// src/utils/formatters.ts
// Форматирование дат, времени и текста
// noinspection GrazieInspection

import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { WEEK_DAYS } from '../config/constants.js';
import type { WeekType } from '../types';

export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd.MM.yyyy', { locale: ru });
}

export function formatTime(time: string): string {
    // Время приходит в формате HH:MM:SS, возвращаем HH:MM
    return time.slice(0, 5);
}

export function formatDateLong(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'd MMMM yyyy', { locale: ru });
}

export function getDayName(dayIndex: number): string {
    if (dayIndex < 1 || dayIndex > 6) {
        return 'Неизвестный день';
    }
    return WEEK_DAYS[dayIndex - 1]!;
}

export function getCurrentWeekDates(): Date[] {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });

    return Array.from({ length: 6 }, (_, index) => addDays(monday, index));
}

export function getCurrentWeekType(): WeekType {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor(
        (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

    return weekNumber % 2 === 0 ? 'even' : 'odd';
}

export function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
}

export function formatTeacherName(fullName: string | null): string {
    if (!fullName) {
        return 'Не указан';
    }

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0]!;
    }

    if (parts.length === 2) {
        return `${parts[0]} ${parts[1]![0]}.`;
    }

    // Фамилия И. О.
    return `${parts[0]} ${parts[1]![0]}. ${parts[2]![0]}.`;
}

export function formatCabinetNumber(cabinet: string | null): string {
    return cabinet || 'Не указан';
}