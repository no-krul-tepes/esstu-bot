// src/utils/week-calculator.ts
// Утилиты для работы с четными/нечетными неделями

import type { WeekType } from '../types';

const Month = {
    JANUARY: 0,
    FEBRUARY: 1,
    MARCH: 2,
    APRIL: 3,
    MAY: 4,
    JUNE: 5,
    JULY: 6,
    AUGUST: 7,
    SEPTEMBER: 8,
    OCTOBER: 9,
    NOVEMBER: 10,
    DECEMBER: 11,
} as const;

const DayOfWeek = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
} as const;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function getWeekTypeForDate(date: Date): WeekType {
    const referenceDate = getReferenceDate(date);
    const diffWeeks = (date.getTime() - referenceDate.getTime()) / MS_PER_WEEK;

    if (diffWeeks >= 0) {
        return Math.trunc(diffWeeks) % 2 === 0 ? 'odd' : 'even';
    }

    return Math.trunc(diffWeeks + 1 / 7) % 2 === 0 ? 'even' : 'odd';
}

export function getCurrentWeekType(): WeekType {
    return getWeekTypeForDate(new Date());
}

export function getWeekTypeLabel(weekType: WeekType): string {
    return weekType === 'even' ? 'Четная неделя' : 'Нечетная неделя';
}

function getReferenceDate(targetDateTime: Date): Date {
    const currentYear = targetDateTime.getFullYear();
    const currentMonth = targetDateTime.getMonth();

    const referenceYear =
        currentMonth >= Month.AUGUST ? currentYear : currentYear - 1;

    const firstSeptember = new Date(referenceYear, Month.SEPTEMBER, 1);
    const firstSeptemberDayOfWeek = firstSeptember.getDay();

    let referenceMonth: number = Month.SEPTEMBER;
    let referenceDay = 1;

    switch (firstSeptemberDayOfWeek) {
        case DayOfWeek.MONDAY:
            referenceMonth = Month.SEPTEMBER;
            referenceDay = 1;
            break;
        case DayOfWeek.TUESDAY:
        case DayOfWeek.WEDNESDAY:
        case DayOfWeek.THURSDAY:
        case DayOfWeek.FRIDAY:
            referenceMonth = Month.AUGUST;
            referenceDay = 31 - firstSeptemberDayOfWeek + 2;
            break;
        case DayOfWeek.SATURDAY:
            referenceMonth = Month.SEPTEMBER;
            referenceDay = 3;
            break;
        case DayOfWeek.SUNDAY:
            referenceMonth = Month.SEPTEMBER;
            referenceDay = 2;
            break;
    }

    return new Date(referenceYear, referenceMonth, referenceDay);
}