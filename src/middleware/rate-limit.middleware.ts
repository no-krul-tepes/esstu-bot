// src/middleware/rate-limit.middleware.ts
// Rate limiting для защиты от спама

import { APP_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { AppError, ErrorCode } from '../types';
import type { BotContext } from '../types';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private limits = new Map<number, RateLimitEntry>();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // Очистка старых записей каждую минуту
        setInterval(() => this.cleanup(), 60000);
    }

    check(userId: number): boolean {
        const now = Date.now();
        const entry = this.limits.get(userId);

        if (!entry || now > entry.resetAt) {
            // Создаем новую запись
            this.limits.set(userId, {
                count: 1,
                resetAt: now + this.windowMs,
            });
            return true;
        }

        if (entry.count >= this.maxRequests) {
            logger.warn('Rate limit exceeded', { userId, count: entry.count });
            return false;
        }

        // Инкрементируем счетчик
        entry.count++;
        return true;
    }

    reset(userId: number): void {
        this.limits.delete(userId);
    }

    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, entry] of this.limits.entries()) {
            if (now > entry.resetAt) {
                this.limits.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('Rate limiter cleanup', { entriesRemoved: cleaned });
        }
    }

    getStats(): { activeUsers: number; totalRequests: number } {
        let totalRequests = 0;

        for (const entry of this.limits.values()) {
            totalRequests += entry.count;
        }

        return {
            activeUsers: this.limits.size,
            totalRequests,
        };
    }
}

const rateLimiter = new RateLimiter(
    APP_CONFIG.RATE_LIMIT.WINDOW_MS,
    APP_CONFIG.RATE_LIMIT.MAX_REQUESTS
);

export async function rateLimitMiddleware(
    ctx: BotContext,
    next: () => Promise<void>
): Promise<void> {
    const userId = ctx.from?.id;

    if (!userId) {
        await next();
        return;
    }

    if (!rateLimiter.check(userId)) {
        throw new AppError(
            'Rate limit exceeded',
            ErrorCode.RATE_LIMIT_EXCEEDED,
            429,
            true,
            { userId }
        );
    }

    await next();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resetRateLimit(userId: number): void {
    rateLimiter.reset(userId);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRateLimiterStats() {
    return rateLimiter.getStats();
}