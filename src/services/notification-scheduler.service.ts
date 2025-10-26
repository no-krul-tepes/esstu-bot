// src/services/notification-scheduler.service.ts
// Scheduler for automatic notification processing

import { logger } from '../utils/logger.js';
import { NotificationService, scheduleNotificationsForToday } from './notification.service.js';
import { deleteOldNotifications } from '../repositories/notify.repository.js';
import type { Bot } from 'grammy';
import type { BotContext } from '../types';

export class NotificationScheduler {
    private notificationService: NotificationService;
    private processingInterval: Timer | null = null;
    private schedulingInterval: Timer | null = null;
    private cleanupInterval: Timer | null = null;

    // Check for pending notifications every 1 minute
    private readonly PROCESSING_INTERVAL_MS = 60 * 1000;

    // Schedule new notifications every 30 minutes
    private readonly SCHEDULING_INTERVAL_MS = 30 * 60 * 1000;

    // Cleanup old notifications once a day (24 hours)
    private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

    constructor(private bot: Bot<BotContext>) {
        this.notificationService = new NotificationService(bot);
    }

    start(): void {
        logger.info('Starting notification scheduler');

        // Start processing pending notifications
        this.processingInterval = setInterval(() => {
            this.processNotifications();
        }, this.PROCESSING_INTERVAL_MS);

        // Start scheduling new notifications
        this.schedulingInterval = setInterval(() => {
            this.scheduleNotifications();
        }, this.SCHEDULING_INTERVAL_MS);

        // Start cleanup job
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldNotifications();
        }, this.CLEANUP_INTERVAL_MS);

        // Run immediately on start
        this.processNotifications();
        this.scheduleNotifications();

        logger.info('Notification scheduler started', {
            processingIntervalMs: this.PROCESSING_INTERVAL_MS,
            schedulingIntervalMs: this.SCHEDULING_INTERVAL_MS,
            cleanupIntervalMs: this.CLEANUP_INTERVAL_MS,
        });
    }

    stop(): void {
        logger.info('Stopping notification scheduler');

        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }

        if (this.schedulingInterval) {
            clearInterval(this.schedulingInterval);
            this.schedulingInterval = null;
        }

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        logger.info('Notification scheduler stopped');
    }

    private async processNotifications(): Promise<void> {
        try {
            logger.debug('Processing pending notifications');
            await this.notificationService.sendPendingNotifications();
        } catch (error) {
            logger.error('Error in notification processing', { error });
        }
    }

    private async scheduleNotifications(): Promise<void> {
        try {
            logger.debug('Scheduling notifications for today');
            await scheduleNotificationsForToday(this.bot);
        } catch (error) {
            logger.error('Error in notification scheduling', { error });
        }
    }

    private async cleanupOldNotifications(): Promise<void> {
        try {
            logger.debug('Cleaning up old notifications');
            const deletedCount = await deleteOldNotifications(30); // Delete notifications older than 30 days
            logger.info('Old notifications cleanup complete', { deletedCount });
        } catch (error) {
            logger.error('Error in notification cleanup', { error });
        }
    }

    // Manual trigger methods for testing
    async triggerProcessing(): Promise<void> {
        await this.processNotifications();
    }

    async triggerScheduling(): Promise<void> {
        await this.scheduleNotifications();
    }

    async triggerCleanup(): Promise<void> {
        await this.cleanupOldNotifications();
    }
}

let schedulerInstance: NotificationScheduler | null = null;

export function startNotificationScheduler(bot: Bot<BotContext>): NotificationScheduler {
    if (schedulerInstance) {
        logger.warn('Notification scheduler already running');
        return schedulerInstance;
    }

    schedulerInstance = new NotificationScheduler(bot);
    schedulerInstance.start();
    return schedulerInstance;
}

export function stopNotificationScheduler(): void {
    if (schedulerInstance) {
        schedulerInstance.stop();
        schedulerInstance = null;
    }
}

export function getNotificationScheduler(): NotificationScheduler | null {
    return schedulerInstance;
}
