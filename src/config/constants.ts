// src/config/constants.ts
// Глобальные константы приложения

export const APP_CONFIG = {
    // Pagination
    MAX_GROUPS_PER_PAGE: parseInt(process.env.MAX_GROUPS_PER_PAGE || '9', 10),
    BUTTONS_PER_ROW: parseInt(process.env.BUTTONS_PER_ROW || '2', 10),

    // Cache
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),

    // Image Generation
    SCHEDULE_IMAGE: {
        WIDTH: parseInt(process.env.SCHEDULE_IMAGE_WIDTH || '800', 10),
        HEIGHT: parseInt(process.env.SCHEDULE_IMAGE_HEIGHT || '1000', 10),
        FONT_FAMILY: process.env.SCHEDULE_FONT_FAMILY || 'Arial',
        BACKGROUND_COLOR: '#F5F7FA',
        PRIMARY_COLOR: '#2C3E50',
        SECONDARY_COLOR: '#3498DB',
        ACCENT_COLOR: '#E74C3C',
    },

    // Rate Limiting
    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
    },

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    // Environment
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

export const MESSAGES = {
    START: {
        TITLE: '🎓 Добро пожаловать в Бот Расписания!',
        DESCRIPTION: `
Я помогу вам отслеживать расписание занятий.

✨ Возможности:
- 📅 Просмотр расписания на неделю
- 🔔 Уведомления о занятиях
- 📊 Красивое визуальное представление
- ⚡ Быстрый доступ к информации

Для начала работы нажмите кнопку ниже.
    `.trim(),
    },

    TERMS: {
        TEXT: 'Регистрируясь вы принимаете [правила сервиса](https://telegra.ph/pravila-servisa-bot)',
        BUTTON: '✅ Согласиться',
    },

    DEPARTMENT_SELECTION: {
        TEXT: '🏛️ Выберите ваше подразделение:',
    },

    COURSE_SELECTION: {
        TEXT: '📚 Выберите курс:',
    },

    GROUP_SELECTION: {
        TEXT: '👥 Выберите группу:',
    },

    SCHEDULE_READY: {
        TEXT: '✅ Расписание готово!\n\n📌 Настройки уведомлений можно изменить в любое время командой /settings',
    },

    ERRORS: {
        GENERIC: '❌ Произошла ошибка. Пожалуйста, попробуйте позже.',
        DATABASE: '❌ Ошибка подключения к базе данных. Попробуйте позже.',
        NOT_FOUND: '❌ Запрошенные данные не найдены.',
        RATE_LIMIT: '⏱️ Слишком много запросов. Пожалуйста, подождите немного.',
        IMAGE_GENERATION: '❌ Не удалось сгенерировать изображение расписания.',
    },
} as const;

export const EMOJI = {
    BACK: '🔙',
    NEXT: '▶️',
    PREV: '◀️',
    CHECK: '✅',
    CALENDAR: '📅',
    BELL: '🔔',
    BOOK: '📚',
    GROUP: '👥',
    BUILDING: '🏛️',
    CLOCK: '🕐',
    TEACHER: '👨‍🏫',
    ROOM: '🚪',
} as const;

export const WEEK_DAYS = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
] as const;

export const COURSES = [1, 2, 3, 4, 5, 6] as const;