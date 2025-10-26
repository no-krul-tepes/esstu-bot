// src/services/schedule.service.ts
// Бизнес-логика для работы с расписанием

import { format } from 'date-fns';
import { getCurrentWeekDates, getCurrentWeekType } from '../utils/formatters.js';
import { getWeekTypeForDate } from '../utils/week-calculator.js';
import { getLessonsByGroupAndWeek } from './database.service.js';
import { logger } from '../utils/logger.js';
import type { Lesson } from '../types';
import type { DaySchedule, LessonDisplay } from '../types';

export async function getWeekScheduleForGroup(groupId: number): Promise<DaySchedule[]> {
    const weekDates = getCurrentWeekDates();
    const currentWeekType = getCurrentWeekType();

    logger.debug('Fetching week schedule', { groupId, currentWeekType });

    const lessons = await getLessonsByGroupAndWeek(groupId, weekDates);

    // Группируем уроки по дням
    const lessonsByDay = new Map<string, Lesson[]>();

    for (const lesson of lessons) {
        // Фильтруем по типу недели
        if (lesson.weektype !== currentWeekType) {
            continue;
        }

        const dateKey = formatDateKey(lesson.lessondate);
        const dayLessons = lessonsByDay.get(dateKey) ?? [];
        dayLessons.push(lesson);
        lessonsByDay.set(dateKey, dayLessons);
    }

    // Формируем расписание по дням недели
    const schedule: DaySchedule[] = weekDates.map((date, index) => {
        const dateKey = formatDateKey(date);
        const dayLessons = lessonsByDay.get(dateKey) ?? [];

        // Сортируем уроки по номеру
        dayLessons.sort((a, b) => a.lessonnumber - b.lessonnumber);

        return {
            dayName: getDayNameByIndex(index + 1),
            date,
            lessons: dayLessons.map(transformLessonToDisplay),
        };
    });

    logger.debug('Week schedule prepared', {
        groupId,
        totalLessons: lessons.length,
        daysWithLessons: schedule.filter(d => d.lessons.length > 0).length
    });

    return schedule;
}

export async function getDayScheduleForGroup(
    groupId: number,
    date: Date
): Promise<DaySchedule> {
    const weekType = getWeekTypeForDate(date);
    const lessons = await getLessonsByGroupAndWeek(groupId, [date]);

    const filteredLessons = lessons
        .filter(lesson =>
            lesson.weektype === weekType &&
            formatDateKey(lesson.lessondate) === formatDateKey(date)
        )
        .sort((a, b) => a.lessonnumber - b.lessonnumber);

    const dayOfWeek = date.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek;

    return {
        dayName: getDayNameByIndex(adjustedDayOfWeek),
        date,
        lessons: filteredLessons.map(transformLessonToDisplay),
    };
}

function transformLessonToDisplay(lesson: Lesson): LessonDisplay {
    return {
        number: lesson.lessonnumber,
        name: lesson.name,
        startTime: lesson.starttime.slice(0, 5),
        endTime: lesson.endtime.slice(0, 5),
        teacher: lesson.teachername,
        cabinet: lesson.cabinetnumber,
        type: lesson.lesson_type,
    };
}

function getDayNameByIndex(index: number): string {
    const dayNames = [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
    ];

    return dayNames[index - 1] ?? 'Неизвестный день';
}

function formatDateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function hasLessonsInSchedule(schedule: DaySchedule[]): boolean {
    return schedule.some(day => day.lessons.length > 0);
}

export function countTotalLessons(schedule: DaySchedule[]): number {
    return schedule.reduce((total, day) => total + day.lessons.length, 0);
}