// src/utils/logger.ts
// Система логирования с уровнями

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
}

class Logger {
    private level: LogLevel;
    private readonly levels: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };

    constructor(level: LogLevel = 'info') {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levels[level] >= this.levels[this.level];
    }

    private formatLog(entry: LogEntry): string {
        const contextStr = entry.context
            ? `\n${JSON.stringify(entry.context, null, 2)}`
            : '';
        return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: this.sanitizeContext(context),
        };

        const formattedLog = this.formatLog(entry);

        switch (level) {
            case 'error':
                console.error(formattedLog);
                break;
            case 'warn':
                console.warn(formattedLog);
                break;
            case 'info':
                console.info(formattedLog);
                break;
            case 'debug':
                console.debug(formattedLog);
                break;
        }
    }

    private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
        if (!context) return undefined;

        const sanitized = { ...context };
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey'];

        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.log('warn', message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.log('error', message, context);
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }
}

export const logger = new Logger(
    (process.env.LOG_LEVEL as LogLevel) || 'info'
);