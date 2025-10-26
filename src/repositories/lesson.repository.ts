// src/repositories/lesson.repository.ts
// Repository для работы с таблицей Lesson

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../types';
import type { Lesson, LessonFilter } from '../types';

export async function getLessonsByFilter(filter: LessonFilter): Promise<Lesson[]> {
    try {
        let query;
        const startDate = filter.startDate ?? null;
        const endDateExclusive = filter.endDate
            ? addOneDay(filter.endDate)
            : null;

        if (startDate && endDateExclusive && filter.weekType) {
            query = db<Lesson[]>`
        SELECT 
          lessonid,
          groupid,
          name,
          lessondate,
          dayofweek,
          lessonnumber,
          starttime,
          endtime,
          teachername,
          cabinetnumber,
          lesson_type,
          weektype,
          rawtext,
          dateadded,
          lastupdated
        FROM Lesson
        WHERE groupid = ${filter.groupId}
          AND lessondate >= ${startDate}
          AND lessondate < ${endDateExclusive}
          AND weektype = ${filter.weekType}
        ORDER BY lessondate ASC, lessonnumber ASC
      `;
        } else if (startDate && endDateExclusive) {
            query = db<Lesson[]>`
        SELECT 
          lessonid,
          groupid,
          name,
          lessondate,
          dayofweek,
          lessonnumber,
          starttime,
          endtime,
          teachername,
          cabinetnumber,
          lesson_type,
          weektype,
          rawtext,
          dateadded,
          lastupdated
        FROM Lesson
        WHERE groupid = ${filter.groupId}
          AND lessondate >= ${startDate}
          AND lessondate < ${endDateExclusive}
        ORDER BY lessondate ASC, lessonnumber ASC
      `;
        } else if (filter.weekType) {
            query = db<Lesson[]>`
        SELECT 
          lessonid,
          groupid,
          name,
          lessondate,
          dayofweek,
          lessonnumber,
          starttime,
          endtime,
          teachername,
          cabinetnumber,
          lesson_type,
          weektype,
          rawtext,
          dateadded,
          lastupdated
        FROM Lesson
        WHERE groupid = ${filter.groupId}
          AND weektype = ${filter.weekType}
        ORDER BY lessondate ASC, lessonnumber ASC
      `;
        } else {
            query = db<Lesson[]>`
        SELECT 
          lessonid,
          groupid,
          name,
          lessondate,
          dayofweek,
          lessonnumber,
          starttime,
          endtime,
          teachername,
          cabinetnumber,
          lesson_type,
          weektype,
          rawtext,
          dateadded,
          lastupdated
        FROM Lesson
        WHERE groupid = ${filter.groupId}
        ORDER BY lessondate ASC, lessonnumber ASC
      `;
        }

        const lessons = await query;

        logger.debug('Fetched lessons by filter', { filter, count: lessons.length });
        return lessons;
    } catch (error) {
        logger.error('Failed to fetch lessons', { filter, error });
        throw new DatabaseError('Failed to fetch lessons', { filter, error });
    }
}

function addOneDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
}

export async function getLessonsByGroupAndWeek(
    groupId: number,
    weekDates: Date[]
): Promise<Lesson[]> {
    try {
        if (weekDates.length === 0) {
            return [];
        }

        const startDate = weekDates[0]!;
        const endDate = weekDates[weekDates.length - 1]!;
        const endDateExclusive = addOneDay(endDate);

        const lessons = await db<Lesson[]>`
      SELECT 
        lessonid,
        groupid,
        name,
        lessondate,
        dayofweek,
        lessonnumber,
        starttime,
        endtime,
        teachername,
        cabinetnumber,
        lesson_type,
        weektype,
        rawtext,
        dateadded,
        lastupdated
      FROM Lesson
      WHERE groupid = ${groupId}
        AND lessondate >= ${startDate}
        AND lessondate < ${endDateExclusive}
      ORDER BY lessondate ASC, lessonnumber ASC
    `;

        logger.debug('Fetched lessons for week', { groupId, weekDates, count: lessons.length });
        return lessons;
    } catch (error) {
        logger.error('Failed to fetch lessons for week', { groupId, weekDates, error });
        throw new DatabaseError('Failed to fetch lessons for week', { groupId, error });
    }
}

export async function getLessonById(lessonId: number): Promise<Lesson | null> {
    try {
        const [lesson] = await db<Lesson[]>`
      SELECT 
        lessonid,
        groupid,
        name,
        lessondate,
        dayofweek,
        lessonnumber,
        starttime,
        endtime,
        teachername,
        cabinetnumber,
        weektype,
        rawtext,
        dateadded,
        lastupdated
      FROM Lesson
      WHERE lessonid = ${lessonId}
    `;

        return lesson ?? null;
    } catch (error) {
        logger.error('Failed to fetch lesson', { lessonId, error });
        throw new DatabaseError('Failed to fetch lesson', { lessonId, error });
    }
}