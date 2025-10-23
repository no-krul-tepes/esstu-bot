// src/utils/image-generator.ts
// Генерация изображений расписания с использованием @napi-rs/canvas

import {createCanvas} from '@napi-rs/canvas';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import {APP_CONFIG} from '../config/constants.js';
import {logger} from './logger.js';
import type {DaySchedule, LessonDisplay, ScheduleImageData} from '../types';
import {ImageGenerationError} from '../types';

interface CanvasConfig {
    width: number;
    height: number;
    padding: number;
    headerHeight: number;
    dayHeaderHeight: number;
    lessonHeight: number;
    colors: {
        background: string;
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        lightGray: string;
        white: string;
    };
}

const config: CanvasConfig = {
    width: APP_CONFIG.SCHEDULE_IMAGE.WIDTH,
    height: 0,
    padding: 20,
    headerHeight: 100,
    dayHeaderHeight: 50,
    lessonHeight: 80,
    colors: {
        background: APP_CONFIG.SCHEDULE_IMAGE.BACKGROUND_COLOR,
        primary: APP_CONFIG.SCHEDULE_IMAGE.PRIMARY_COLOR,
        secondary: APP_CONFIG.SCHEDULE_IMAGE.SECONDARY_COLOR,
        accent: APP_CONFIG.SCHEDULE_IMAGE.ACCENT_COLOR,
        text: '#2C3E50',
        lightGray: '#ECF0F1',
        white: '#FFFFFF',
    },
};

export async function generateScheduleImage(data: ScheduleImageData): Promise<Buffer> {
    try {
        logger.debug('Generating schedule image', {
            groupName: data.groupName,
            weekType: data.weekType,
            daysCount: data.lessons.length
        });

        const totalLessons = data.lessons.reduce((sum, day) => sum + day.lessons.length, 0);
        config.height = calculateCanvasHeight(data.lessons.length, totalLessons);

        const canvas = createCanvas(config.width, config.height);
        const ctx = canvas.getContext('2d');

        drawBackground(ctx);
        drawHeader(ctx, data.groupName, data.weekType);

        let yOffset = config.headerHeight + config.padding;

        for (const day of data.lessons) {
            yOffset = drawDaySchedule(ctx, day, yOffset);
        }

        drawFooter(ctx, data.generatedAt);

        const buffer = canvas.toBuffer('image/png');

        logger.info('Schedule image generated', {
            size: buffer.length,
            width: config.width,
            height: config.height
        });

        return buffer;
    } catch (error) {
        logger.error('Failed to generate schedule image', { error });
        throw new ImageGenerationError('Failed to generate schedule image', { error });
    }
}

function calculateCanvasHeight(daysCount: number, totalLessons: number): number {
    return (
        config.headerHeight +
        config.padding * 2 +
        daysCount * config.dayHeaderHeight +
        totalLessons * config.lessonHeight +
        daysCount * config.padding +
        60
    );
}

function drawBackground(ctx: any): void {
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, config.width, config.height);
}

function drawHeader(
    ctx: any,
    groupName: string,
    weekType: string,
): void {
    const gradient = ctx.createLinearGradient(0, 0, config.width, config.headerHeight);
    gradient.addColorStop(0, config.colors.secondary);
    gradient.addColorStop(1, config.colors.primary);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.headerHeight);

    ctx.fillStyle = config.colors.white;
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(groupName, config.width / 2, 40);

    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Расписание на неделю', config.width / 2, 70);
}

function drawDaySchedule(
    ctx: any,
    day: DaySchedule,
    yOffset: number
): number {
    let currentY = yOffset;

    currentY = drawDayHeader(ctx, day.dayName, day.date, currentY);

    if (day.lessons.length === 0) {
        currentY = drawNoLessonsMessage(ctx, currentY);
        return currentY + config.padding;
    }

    for (const lesson of day.lessons) {
        currentY = drawLesson(ctx, lesson, currentY);
    }

    return currentY + config.padding;
}

function drawDayHeader(
    ctx: any,
    dayName: string,
    date: Date,
    y: number
): number {
    const x = config.padding;
    const width = config.width - config.padding * 2;

    ctx.fillStyle = config.colors.primary;
    roundRect(ctx, x, y, width, config.dayHeaderHeight, 8);
    ctx.fill();

    ctx.fillStyle = config.colors.white;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(dayName, x + 15, y + config.dayHeaderHeight / 2);

    ctx.font = '18px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
        format(date, 'd MMMM', { locale: ru }),
        x + width - 15,
        y + config.dayHeaderHeight / 2
    );

    return y + config.dayHeaderHeight + 10;
}

function drawNoLessonsMessage(ctx: any, y: number): number {
    const x = config.padding;
    const width = config.width - config.padding * 2;
    const height = 50;

    ctx.fillStyle = config.colors.lightGray;
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();

    ctx.fillStyle = config.colors.text;
    ctx.font = 'italic 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Занятий нет', config.width / 2, y + height / 2);

    return y + height + 5;
}

function drawLesson(
    ctx: any,
    lesson: LessonDisplay,
    y: number
): number {
    const x = config.padding;
    const width = config.width - config.padding * 2;

    ctx.fillStyle = config.colors.white;
    roundRect(ctx, x, y, width, config.lessonHeight, 8);
    ctx.fill();

    ctx.strokeStyle = config.colors.lightGray;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = config.colors.secondary;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lesson.number.toString(), x + 30, y + 45);

    ctx.fillStyle = config.colors.text;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lessonName = truncateText(ctx, lesson.name, width - 120);
    ctx.fillText(lessonName, x + 70, y + 15);

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = config.colors.secondary;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${lesson.startTime} - ${lesson.endTime}`, x + 70, y + 48);

    if (lesson.teacher) {
        ctx.fillStyle = config.colors.text;
        ctx.font = '14px Arial, sans-serif';
        const teacherText = truncateText(ctx, lesson.teacher, width - 200);
        ctx.fillText(`${teacherText}`, x + 70, y + 68);
    }

    if (lesson.cabinet) {
        ctx.fillStyle = config.colors.accent;
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${lesson.cabinet}`, x + width - 15, y + 45);
    }

    return y + config.lessonHeight + 10;
}

function drawFooter(ctx: any, generatedAt: Date): void {
    const y = config.height - 40;

    ctx.fillStyle = config.colors.text;
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        `Сгенерировано: ${format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: ru })}`,
        config.width / 2,
        y
    );
}

function roundRect(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function truncateText(
    ctx: any,
    text: string,
    maxWidth: number
): string {
    const metrics = ctx.measureText(text);

    if (metrics.width <= maxWidth) {
        return text;
    }

    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
    }

    return truncated + '...';
}