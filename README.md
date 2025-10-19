// README.md
# 🎓 Telegram Schedule Bot

Production-ready Telegram бот для отображения расписания учебного заведения с красивой визуализацией.

## 🚀 Особенности

- ✨ Интуитивная регистрация через inline-клавиатуры
- 📅 Красивая генерация изображений расписания
- 🔔 Поддержка уведомлений (функционал в разработке)
- 💾 Надежное хранение данных в PostgreSQL
- 🛡️ Rate limiting и защита от спама
- 📊 Полное логирование и мониторинг
- 🎨 Современный дизайн с поддержкой темной темы

## 🛠️ Технологический стек

- **Runtime**: Bun (современная альтернатива Node.js)
- **Язык**: TypeScript с strict mode
- **Bot Framework**: Grammy.js
- **База данных**: PostgreSQL
- **Генерация изображений**: Canvas API
- **Валидация**: Zod
- **Работа с датами**: date-fns

## 📋 Требования

- Bun >= 1.0.0
- PostgreSQL >= 14
- Telegram Bot Token (получить у [@BotFather](https://t.me/BotFather))

## 🔧 Установка

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd telegram-schedule-bot
```

### 2. Установка зависимостей
```bash
bun install
```

### 3. Настройка окружения

Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

Заполните необходимые переменные:
```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=postgresql://username:password@localhost:5432/schedule_db
NODE_ENV=development
LOG_LEVEL=info
```

### 4. Настройка базы данных

Примените схему базы данных из документации проекта:
```bash
psql -U username -d schedule_db -f schema.sql
```

### 5. Запуск бота

**Режим разработки** (с hot reload):
```bash
bun run dev
```

**Production режим**:
```bash
bun run start
```

**Сборка**:
```bash
bun run build
```

## 📁 Структура проекта
```
src/
├── index.ts                 # Точка входа
├── bot.ts                   # Инициализация бота
├── config/                  # Конфигурация
│   ├── database.ts         # Подключение к PostgreSQL
│   └── constants.ts        # Константы приложения
├── types/                   # TypeScript типы
│   ├── database.ts         # Типы для БД
│   ├── bot.ts              # Типы для бота
│   └── errors.ts           # Кастомные ошибки
├── handlers/                # Обработчики команд
│   ├── start.handler.ts
│   ├── registration.handler.ts
│   ├── schedule.handler.ts
│   ├── callback.handler.ts
│   └── help.handler.ts
├── services/                # Бизнес-логика
│   ├── database.service.ts
│   ├── schedule.service.ts
│   ├── cache.service.ts
│   └── pagination.service.ts
├── repositories/            # Слой данных
│   ├── department.repository.ts
│   ├── group.repository.ts
│   ├── lesson.repository.ts
│   └── chat.repository.ts
├── keyboards/               # Inline клавиатуры
│   ├── navigation.keyboard.ts
│   └── pagination.keyboard.ts
├── utils/                   # Утилиты
│   ├── logger.ts           # Логирование
│   ├── validators.ts       # Валидация
│   ├── formatters.ts       # Форматирование
│   ├── week-calculator.ts  # Расчет недель
│   └── image-generator.ts  # Генерация изображений
└── middleware/              # Middleware
    ├── session.middleware.ts
    ├── error.middleware.ts
    ├── logging.middleware.ts
    └── rate-limit.middleware.ts
```

## 🎯 Использование

### Команды бота

- `/start` - Начать регистрацию
- `/schedule` - Показать расписание на неделю
- `/help` - Справка по использованию

### Процесс регистрации

1. Пользователь отправляет `/start`
2. Принимает правила сервиса
3. Выбирает подразделение
4. Выбирает курс
5. Выбирает группу
6. Автоматически получает расписание

### API для разработчиков
```typescript
// Получить расписание для группы
import { getWeekScheduleForGroup } from './services/schedule.service.js';

const schedule = await getWeekScheduleForGroup(groupId);

// Создать чат
import { createChat } from './services/database.service.js';

const chat = await createChat({
  groupid: 1,
  name: 'Test Chat',
  externalchatid: '12345',
  notificationtime: '08:00:00',
  isnotificationenabled: true,
  notifyoneverylesson: false,
});
```

## 🔒 Безопасность

- ✅ Все SQL запросы параметризованы (защита от SQL injection)
- ✅ Rate limiting на уровне пользователей
- ✅ Валидация всех входных данных через Zod
- ✅ Санитизация логов (скрытие токенов и паролей)
- ✅ Graceful shutdown для корректного закрытия соединений

## 📊 Мониторинг и логирование

Бот использует структурированное логирование с уровнями:

- `debug` - Детальная отладочная информация
- `info` - Общая информация о работе
- `warn` - Предупреждения
- `error` - Ошибки

Настройка уровня логирования в `.env`:
```env
LOG_LEVEL=info
```

## 🐛 Отладка

### Проверка здоровья базы данных
```typescript
import { checkDatabaseHealth } from './config/database.js';

const isHealthy = await checkDatabaseHealth();
console.log('Database healthy:', isHealthy);
```

### Просмотр статистики кэша
```typescript
import { cacheService } from './services/cache.service.js';

const stats = cacheService.getStats();
console.log('Cache stats:', stats);
```

### Статистика rate limiter
```typescript
import { getRateLimiterStats } from './middleware/rate-limit.middleware.js';

const stats = getRateLimiterStats();
console.log('Rate limiter stats:', stats);
```

## 🧪 Тестирование
```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run format
```

## 🚀 Деплой

### Docker (рекомендуется)
```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Production
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules

ENV NODE_ENV=production
CMD ["bun", "run", "dist/index.js"]
```

### Systemd Service
```ini
[Unit]
Description=Telegram Schedule Bot
After=network.target postgresql.service

[Service]
Type=simple
User=botuser
WorkingDirectory=/opt/schedule-bot
ExecStart=/usr/local/bin/bun run src/index.ts
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
EnvironmentFile=/opt/schedule-bot/.env

[Install]
WantedBy=multi-user.target
```

## 📝 Лицензия

MIT

## 👥 Контрибьюция

Pull requests приветствуются! Для больших изменений сначала откройте issue.

## 📧 Поддержка

При возникновении проблем создайте issue в репозитории.

---

Made with ❤️ and TypeScript