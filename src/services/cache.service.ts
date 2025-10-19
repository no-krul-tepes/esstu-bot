// src/services/cache.service.ts
// Простой in-memory кэш для справочников

import { logger } from '../utils/logger.js';
import { APP_CONFIG } from '../config/constants.js';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class CacheService {
    private cache = new Map<string, CacheEntry<unknown>>();
    private ttlMs: number;

    constructor(ttlSeconds: number = APP_CONFIG.CACHE_TTL_SECONDS) {
        this.ttlMs = ttlSeconds * 1000;
    }

    set<T>(key: string, data: T, customTtlSeconds?: number): void {
        const ttl = customTtlSeconds ? customTtlSeconds * 1000 : this.ttlMs;
        const expiresAt = Date.now() + ttl;

        this.cache.set(key, { data, expiresAt });
        logger.debug('Cache entry set', { key, expiresAt: new Date(expiresAt) });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            logger.debug('Cache miss', { key });
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            logger.debug('Cache entry expired', { key });
            return null;
        }

        logger.debug('Cache hit', { key });
        return entry.data;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    invalidate(key: string): void {
        this.cache.delete(key);
        logger.debug('Cache entry invalidated', { key });
    }

    invalidatePattern(pattern: string): void {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                count++;
            }
        }
        logger.debug('Cache entries invalidated by pattern', { pattern, count });
    }

    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache cleared', { entriesCleared: size });
    }

    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

export const cacheService = new CacheService();