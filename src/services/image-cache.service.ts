// src/services/image-cache.service.ts
// Image caching service for schedule images

import { logger } from '../utils/logger.js';
import type { WeekType } from '../types';

interface ImageCacheEntry {
    buffer: Buffer;
    expiresAt: number;
}

class ImageCacheService {
    private cache = new Map<string, ImageCacheEntry>();
    // Cache images for 10 minutes (schedules don't change frequently)
    private readonly ttlMs: number = 10 * 60 * 1000;

    generateKey(groupId: number, startDate: string, endDate: string, weekType: WeekType): string {
        return `schedule-img:${groupId}:${startDate}:${endDate}:${weekType}`;
    }

    set(key: string, buffer: Buffer): void {
        const expiresAt = Date.now() + this.ttlMs;
        this.cache.set(key, { buffer, expiresAt });
        logger.debug('Schedule image cached', {
            key,
            size: buffer.length,
            expiresAt: new Date(expiresAt)
        });
    }

    get(key: string): Buffer | null {
        const entry = this.cache.get(key);

        if (!entry) {
            logger.debug('Image cache miss', { key });
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            logger.debug('Image cache entry expired', { key });
            return null;
        }

        logger.debug('Image cache hit', { key, size: entry.buffer.length });
        return entry.buffer;
    }

    invalidate(key: string): void {
        this.cache.delete(key);
        logger.debug('Image cache entry invalidated', { key });
    }

    invalidateGroup(groupId: number): void {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(`schedule-img:${groupId}:`)) {
                this.cache.delete(key);
                count++;
            }
        }
        logger.debug('Group image cache invalidated', { groupId, count });
    }

    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Image cache cleared', { entriesCleared: size });
    }

    getStats(): { size: number; totalBytes: number } {
        let totalBytes = 0;
        for (const entry of this.cache.values()) {
            totalBytes += entry.buffer.length;
        }
        return {
            size: this.cache.size,
            totalBytes,
        };
    }
}

export const imageCacheService = new ImageCacheService();
