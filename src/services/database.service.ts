// src/services/database.service.ts
// Основной сервис для работы с БД через repositories с кэшированием

import * as departmentRepo from '../repositories/department.repository.js';
import * as groupRepo from '../repositories/group.repository.js';
import * as lessonRepo from '../repositories/lesson.repository.js';
import * as chatRepo from '../repositories/chat.repository.js';
import { cacheService } from './cache.service.js';
import { logger } from '../utils/logger.js';
import type {
    Department,
    Group,
    Lesson,
    Chat,
    CreateChat,
    UpdateChat,
    GroupFilter,
    LessonFilter
} from '../types';

const CACHE_KEYS = {
    ALL_DEPARTMENTS: 'departments:all',
    DEPARTMENT_BY_ID: (id: number) => `department:${id}`,
    GROUP_BY_ID: (id: number) => `group:${id}`,
    GROUPS_BY_FILTER: (filter: GroupFilter) =>
        `groups:${filter.departmentId ?? 'all'}:${filter.course ?? 'all'}:${filter.isActive ?? 'all'}`,
} as const;

// Department Services
export async function getAllDepartments(): Promise<Department[]> {
    const cached = cacheService.get<Department[]>(CACHE_KEYS.ALL_DEPARTMENTS);
    if (cached) {
        return cached;
    }

    const departments = await departmentRepo.getAllDepartments();
    cacheService.set(CACHE_KEYS.ALL_DEPARTMENTS, departments);
    return departments;
}

export async function getDepartmentById(departmentId: number): Promise<Department> {
    const cacheKey = CACHE_KEYS.DEPARTMENT_BY_ID(departmentId);
    const cached = cacheService.get<Department>(cacheKey);
    if (cached) {
        return cached;
    }

    const department = await departmentRepo.getDepartmentById(departmentId);
    cacheService.set(cacheKey, department);
    return department;
}

// Group Services
export async function getGroupsByFilter(filter: GroupFilter): Promise<Group[]> {
    const cacheKey = CACHE_KEYS.GROUPS_BY_FILTER(filter);
    const cached = cacheService.get<Group[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const groups = await groupRepo.getGroupsByFilter(filter);
    cacheService.set(cacheKey, groups);
    return groups;
}

export async function getGroupById(groupId: number): Promise<Group> {
    const cacheKey = CACHE_KEYS.GROUP_BY_ID(groupId);
    const cached = cacheService.get<Group>(cacheKey);
    if (cached) {
        return cached;
    }

    const group = await groupRepo.getGroupById(groupId);
    cacheService.set(cacheKey, group);
    return group;
}

export async function getGroupsByDepartmentAndCourse(
    departmentId: number,
    course: number
): Promise<Group[]> {
    return getGroupsByFilter({ departmentId, course, isActive: true });
}

export async function countGroupsByFilter(filter: GroupFilter): Promise<number> {
    return groupRepo.countGroupsByFilter(filter);
}

// Lesson Services
export async function getLessonsByFilter(filter: LessonFilter): Promise<Lesson[]> {
    return lessonRepo.getLessonsByFilter(filter);
}

export async function getLessonsByGroupAndWeek(
    groupId: number,
    weekDates: Date[]
): Promise<Lesson[]> {
    return lessonRepo.getLessonsByGroupAndWeek(groupId, weekDates);
}

// Chat Services
export async function createChat(chatData: CreateChat): Promise<Chat> {
    const chat = await chatRepo.createChat(chatData);
    logger.info('Chat registered', {
        chatId: chat.chatid,
        externalChatId: chat.externalchatid,
        groupId: chat.groupid
    });
    return chat;
}

export async function getChatByExternalId(externalChatId: string): Promise<Chat | null> {
    return chatRepo.getChatByExternalId(externalChatId);
}

export async function getChatById(chatId: number): Promise<Chat> {
    return chatRepo.getChatById(chatId);
}

export async function updateChat(chatId: number, updates: UpdateChat): Promise<Chat> {
    return chatRepo.updateChat(chatId, updates);
}

export async function deleteChat(chatId: number): Promise<void> {
    return chatRepo.deleteChat(chatId);
}

export async function chatExists(externalChatId: string): Promise<boolean> {
    return chatRepo.chatExistsByExternalId(externalChatId);
}