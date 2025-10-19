// src/middleware/session.middleware.ts
// Session management для хранения состояния пользователя

import { session } from 'grammy';
import { RegistrationStep } from '../types';
import type { BotContext, SessionData } from '../types';

export function createInitialSessionData(): SessionData {
    return {
        step: RegistrationStep.START,
        agreedToTerms: false,
    };
}

export const sessionMiddleware = session({
    initial: createInitialSessionData,
    storage: undefined, // Используем in-memory storage
});

// Хелперы для работы с сессией
export function resetSession(ctx: BotContext): void {
    ctx.session = createInitialSessionData();
}

export function updateSessionStep(ctx: BotContext, step: RegistrationStep): void {
    ctx.session.step = step;
}

export function setSelectedDepartment(ctx: BotContext, departmentId: number): void {
    ctx.session.selectedDepartmentId = departmentId;
}

export function setSelectedCourse(ctx: BotContext, course: number): void {
    ctx.session.selectedCourse = course;
}

export function setSelectedGroup(ctx: BotContext, groupId: number): void {
    ctx.session.selectedGroupId = groupId;
}

export function setCurrentPage(ctx: BotContext, page: number): void {
    ctx.session.currentPage = page;
}

export function isRegistrationComplete(ctx: BotContext): boolean {
    return ctx.session.step === RegistrationStep.COMPLETED;
}

export function hasAgreedToTerms(ctx: BotContext): boolean {
    return ctx.session.agreedToTerms === true;
}