// src/services/pagination.service.ts
// Сервис для работы с пагинацией

import { APP_CONFIG } from '../config/constants.js';
import { validatePage } from '../utils/validators.js';
import type { PaginatedResult, PaginationOptions } from '../types';

export function paginateItems<T>(
    items: T[],
    currentPage: number,
    itemsPerPage: number = APP_CONFIG.MAX_GROUPS_PER_PAGE
): PaginatedResult<T> {
    const validatedPage = validatePage(currentPage);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    // Корректируем страницу если она выходит за границы
    const safePage = Math.max(0, Math.min(validatedPage, totalPages - 1));

    const startIndex = safePage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    const pagination: PaginationOptions = {
        currentPage: safePage,
        totalPages: Math.max(1, totalPages),
        itemsPerPage,
    };

    return {
        items: paginatedItems,
        pagination,
        hasNext: safePage < totalPages - 1,
        hasPrev: safePage > 0,
    };
}

export function calculateTotalPages(
    totalItems: number,
    itemsPerPage: number = APP_CONFIG.MAX_GROUPS_PER_PAGE
): number {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
}

export function isValidPage(page: number, totalPages: number): boolean {
    return page >= 0 && page < totalPages;
}