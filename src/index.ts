// src/index.ts
// Точка входа приложения

import { createBot, setupBotCommands, stopBot } from './bot.js';
import { checkDatabaseHealth, closeDatabaseConnection } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { startNotificationScheduler, stopNotificationScheduler } from './services/notification-scheduler.service.js';

async function validateEnvironment(): Promise<void> {
    const requiredEnvVars = ['BOT_TOKEN', 'DATABASE_URL'];
    const missing: string[] = [];

    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file.'
        );
    }
}

async function startApplication(): Promise<void> {
    try {
        logger.info('Starting application...');

        // Проверяем переменные окружения
        await validateEnvironment();

        // Проверяем подключение к БД
        const dbHealthy = await checkDatabaseHealth();
        if (!dbHealthy) {
            throw new Error('Database health check failed');
        }

        logger.info('Database connection healthy');

        // Создаем и запускаем бота
        const botToken = process.env.BOT_TOKEN!;
        const bot = createBot(botToken);

        // Устанавливаем обработчик ошибок бота
        bot.catch(errorHandler);

        // Устанавливаем команды бота
        await setupBotCommands(bot);

        // Запускаем бота
        logger.info('Starting bot polling...');
        await bot.start({
            onStart: (botInfo) => {
                logger.info('Bot started successfully', {
                    username: botInfo.username,
                    id: botInfo.id,
                });
            },
        });

        // Запускаем планировщик уведомлений
        logger.info('Starting notification scheduler...');
        startNotificationScheduler(bot);

        // Обработка graceful shutdown
        setupGracefulShutdown(bot);

    } catch (error) {
        logger.error('Failed to start application', { error });
        process.exit(1);
    }
}

function setupGracefulShutdown(bot: ReturnType<typeof createBot>): void {
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        try {
            // Останавливаем планировщик уведомлений
            stopNotificationScheduler();

            // Останавливаем бота
            await stopBot(bot);

            // Закрываем соединение с БД
            await closeDatabaseConnection();

            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown', { error });
            process.exit(1);
        }
    };

    // Обработчики сигналов
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Обработчик необработанных ошибок
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { error });
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled rejection', { reason, promise });
        process.exit(1);
    });
}

// Запуск приложения
void startApplication();