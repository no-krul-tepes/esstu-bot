// src/types/bot.ts
// Типы для контекста бота и состояния пользователя

import { Context, SessionFlavor } from 'grammy';
import {WeekType} from "./database";

// Расширяем SessionData
export interface SessionData {
    step: RegistrationStep;
    selectedDepartmentId?: number;
    selectedCourse?: number;
    selectedGroupId?: number;
    currentPage?: number;
    agreedToTerms?: boolean;
    settings?: SettingsSessionData;
    shouldSendSchedule?: boolean;
}

// Типы для времени уведомлений
export interface NotificationTimeOption {
    label: string;
    value: string;
}
export enum RegistrationStep {
    START = 'start',
    TERMS_AGREEMENT = 'terms_agreement',
    DEPARTMENT_SELECTION = 'department_selection',
    COURSE_SELECTION = 'course_selection',
    GROUP_SELECTION = 'group_selection',
    COMPLETED = 'completed',
}

export type BotContext = Context & SessionFlavor<SessionData>;

// Типы для callback data
export interface CallbackData {
    action: CallbackAction;
    value?: string | number;
    page?: number;
}

export enum CallbackAction {
    AGREE_TERMS = 'agree_terms',
    SELECT_DEPARTMENT = 'dept',
    SELECT_COURSE = 'course',
    SELECT_GROUP = 'group',
    NAVIGATE_BACK = 'back',
    NAVIGATE_NEXT = 'next',
    NAVIGATE_PREV = 'prev',
    SHOW_SCHEDULE = 'schedule',
    OPEN_SETTINGS = 'settings',
    CHANGE_GROUP = 'change_group',
    CHANGE_NOTIFICATION_TIME = 'change_time',
    TOGGLE_NOTIFICATIONS = 'toggle_notify',
    TOGGLE_EVERY_LESSON = 'toggle_every',
    SET_NOTIFICATION_TIME = 'set_time',
    CONFIRM_CHANGE_GROUP = 'confirm_change',
    CANCEL_ACTION = 'cancel',
}

export interface SettingsSessionData {
    changingGroup?: boolean;
    newNotificationTime?: string;
}

// Типы для генерации изображений
export interface ScheduleImageData {
    groupName: string;
    weekType: WeekType;
    lessons: DaySchedule[];
    generatedAt: Date;
}

export interface DaySchedule {
    dayName: string;
    date: Date;
    lessons: LessonDisplay[];
}

export interface LessonDisplay {
    number: number;
    name: string;
    startTime: string;
    endTime: string;
    teacher: string | null;
    cabinet: string | null;
    type: string | null;
}

// Типы для пагинации
export interface PaginationOptions {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationOptions;
    hasNext: boolean;
    hasPrev: boolean;
}