// src/config/database.ts
// Конфигурация подключения к PostgreSQL с connection pooling

import postgres from 'postgres';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../types';

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
}

function parseDatabaseUrl(url: string): DatabaseConfig {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '5432', 10),
            database: parsed.pathname.slice(1),
            username: parsed.username,
            password: parsed.password,
            // Optimized for better performance - increased from 10 to 20
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
            idleTimeout: 30,
            connectionTimeout: 10,
        };
    } catch (error) {
        throw new DatabaseError('Invalid DATABASE_URL format', { url, error });
    }
}

function createDatabaseConnection() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new DatabaseError('DATABASE_URL environment variable is not set');
    }

    const config = parseDatabaseUrl(databaseUrl);

    const sql = postgres(databaseUrl, {
        max: config.maxConnections,
        idle_timeout: config.idleTimeout,
        connect_timeout: config.connectionTimeout,
        onnotice: () => {}, // Отключаем notice логи
        transform: {
            undefined: null, // Преобразуем undefined в null для PostgreSQL
        },
    });

    logger.info('Database connection pool initialized', {
        host: config.host,
        port: config.port,
        database: config.database,
        maxConnections: config.maxConnections,
    });

    return sql;
}

export const db = createDatabaseConnection();

// Graceful shutdown handler
export async function closeDatabaseConnection(): Promise<void> {
    try {
        await db.end({ timeout: 5 });
        logger.info('Database connection pool closed');
    } catch (error) {
        logger.error('Error closing database connection', { error });
        throw new DatabaseError('Failed to close database connection', { error });
    }
}

// Health check функция
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        await db`SELECT 1 as health_check`;
        return true;
    } catch (error) {
        logger.error('Database health check failed', { error });
        return false;
    }
}