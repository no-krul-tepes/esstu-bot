// src/utils/week-calculator.ts
// Утилиты для работы с четными/нечетными неделями

import { startOfWeek, differenceInWeeks } from 'date-fns';
import type { WeekType } from '../types/database.js';

const SEMESTER_START_DATE = new Date(2024, 8, 1); // 1 сентября 2024

export function getWeekTypeForDate(date: Date): WeekType {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    const semesterStart = startOfWeek(SEMESTER_START_DATE, { weekStartsOn: 1 });

    const weeksDifference = differenceInWeeks(monday, semesterStart);
    const weekNumber = weeksDifference + 1;

    return weekNumber % 2 === 0 ? 'even' : 'odd';
}

export function getCurrentWeekType(): WeekType {
    return getWeekTypeForDate(new Date());
}

export function getWeekTypeLabel(weekType: WeekType): string {
    return weekType === 'even' ? 'Четная неделя' : 'Нечетная неделя';
}