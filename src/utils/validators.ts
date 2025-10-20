// src/utils/validators.ts
// Валидаторы входных данных с использованием Zod

import { z } from 'zod';
import { ValidationError } from '../types';

// Схемы валидации
export const chatIdSchema = z.number().int().positive();
export const departmentIdSchema = z.number().int().positive();
export const courseSchema = z.number().int().min(1).max(6);
export const groupIdSchema = z.number().int().positive();
export const pageSchema = z.number().int().min(0);
export const externalChatIdSchema = z.string().min(1).max(100);

export const createChatSchema = z.object({
    groupid: groupIdSchema,
    name: z.string().min(1).max(255),
    externalchatid: externalChatIdSchema,
    notificationtime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
    isnotificationenabled: z.boolean().default(true),
    notifyoneverylesson: z.boolean().default(false),
});

// Валидаторы
export function validateChatId(value: unknown): number {
    try {
        return chatIdSchema.parse(value);
    } catch (error) {
        throw new ValidationError('Invalid chat ID', { value, error });
    }
}

export function validateDepartmentId(value: unknown): number {
    try {
        return departmentIdSchema.parse(value);
    } catch (error) {
        throw new ValidationError('Invalid department ID', { value, error });
    }
}

export function validateCourse(value: unknown): number {
    try {
        return courseSchema.parse(value);
    } catch (error) {
        throw new ValidationError('Invalid course number', { value, error });
    }
}

export function validateGroupId(value: unknown): number {
    try {
        return groupIdSchema.parse(value);
    } catch (error) {
        throw new ValidationError('Invalid group ID', { value, error });
    }
}

export function validatePage(value: unknown): number {
    try {
        return pageSchema.parse(value);
    } catch (error) {
        throw new ValidationError('Invalid page number', { value, error });
    }
}

export function validateExternalChatId(value: unknown): string {
    try {
        return externalChatIdSchema.parse(value);
    } catch (error) {
        throw new ValidationError('Invalid external chat ID', { value, error });
    }
}

// Валидация callback data
export function parseCallbackData(data: string): { action: string; value?: string } {
    // Разделяем только по первому двоеточию
    const colonIndex = data.indexOf(':');

    if (colonIndex === -1) {
        // Нет значения, только action
        return {
            action: data,
        };
    }

    // Извлекаем action и остаток как value
    const action = data.slice(0, colonIndex);
    const value = data.slice(colonIndex + 1);

    if (!action) {
        throw new ValidationError('Invalid callback data format', { data });
    }

    return {
        action,
        value: value || undefined,
    };
}
