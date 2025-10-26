// src/types/database.ts
// Типы для всех таблиц базы данных с строгой типизацией

export interface EducationalInstitution {
    institutionid: number;
    name: string;
}

export interface Department {
    departmentid: number;
    name: string;
    url: string;
}

export interface Group {
    groupid: number;
    institutionid: number;
    departmentid: number;
    name: string;
    course: number;
    url: string;
    dateadded: Date;
    isactive: boolean;
}

export interface Chat {
    chatid: number;
    groupid: number;
    name: string;
    externalchatid: string;
    notificationtime: string;
    isnotificationenabled: boolean;
    notifyoneverylesson: boolean;
    dateadded: Date;
}

export type WeekType = 'even' | 'odd';

export interface Lesson {
    lessonid: number;
    groupid: number;
    name: string;
    lessondate: Date;
    dayofweek: number;
    lessonnumber: number;
    starttime: string;
    endtime: string;
    teachername: string | null;
    cabinetnumber: string | null;
    lesson_type: string | null;
    weektype: WeekType;
    rawtext: string | null;
    dateadded: Date;
    lastupdated: Date;
}

export type ChangeType = 'new' | 'update' | 'delete';

export interface ScheduleChange {
    changeid: number;
    lessonid: number;
    changetype: ChangeType;
    changedat: Date;
    olddata: Record<string, unknown> | null;
    newdata: Record<string, unknown> | null;
}

export interface NotifyQueue {
    notifyid: number;
    chatid: number;
    lessonid: number | null;
    scheduledtime: Date;
    issent: boolean;
    createdat: Date;
    sentat: Date | null;
}

// Вспомогательные типы для создания записей
export type CreateChat = Omit<Chat, 'chatid' | 'dateadded'>;
export type UpdateChat = Partial<Omit<Chat, 'chatid' | 'externalchatid' | 'dateadded'>>;

// Типы для запросов с фильтрацией
export interface GroupFilter {
    departmentId?: number;
    course?: number;
    isActive?: boolean;
}

export interface LessonFilter {
    groupId: number;
    startDate?: Date;
    endDate?: Date;
    weekType?: WeekType;
}