// src/handlers/registration.handler.ts
// Обработчики флоу регистрации (ОБНОВЛЕННАЯ ВЕРСИЯ)

import { MESSAGES, EMOJI } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { parseCallbackData, validateDepartmentId, validateCourse, validateGroupId } from '../utils/validators.js';
import {
    updateSessionStep,
    setSelectedDepartment,
    setSelectedCourse,
    setSelectedGroup,
    setCurrentPage,
    hasAgreedToTerms,
} from '../middleware/session.middleware.js';
import { RegistrationStep } from '../types';
import {
    getAllDepartments,
    getGroupsByDepartmentAndCourse,
    getGroupById,
    createChat,
    countChatsByGroupId,
    chatExists,
} from '../services/database.service.js';
import { paginateItems } from '../services/pagination.service.js';
import {
    createDepartmentsKeyboard,
    createCoursesKeyboard,
    createGroupsKeyboard,
} from '../keyboards/navigation.keyboard.js';
import { triggerGroupParsing } from '../services/parse.service.js';
import type { BotContext } from '../types';

// Обработчик согласия с правилами
export async function handleAgreeTerms(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;

    if (!userId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить пользователя');
        return;
    }

    logger.info('User agreed to terms', { userId });

    ctx.session.agreedToTerms = true;

    await ctx.answerCallbackQuery(`${EMOJI.CHECK} Отлично!`);
    await ctx.editMessageText(
        `${EMOJI.CHECK} ${MESSAGES.TERMS.TEXT}\n\n✅ Вы согласились с правилами.`,
        { parse_mode: 'Markdown' }
    );

    // Переходим к выбору подразделения
    await showDepartmentSelection(ctx);
}

// Показать выбор подразделения
export async function showDepartmentSelection(ctx: BotContext): Promise<void> {
    const isChangingGroup = ctx.session.settings?.changingGroup === true;

    if (!isChangingGroup && !hasAgreedToTerms(ctx)) {
        await ctx.reply('⚠️ Сначала необходимо согласиться с правилами.');
        return;
    }

    try {
        const departments = await getAllDepartments();

        if (departments.length === 0) {
            await ctx.reply('❌ Подразделения не найдены. Обратитесь к администратору.');
            return;
        }

        await ctx.reply(MESSAGES.DEPARTMENT_SELECTION.TEXT, {
            reply_markup: createDepartmentsKeyboard(departments),
        });

        updateSessionStep(ctx, RegistrationStep.DEPARTMENT_SELECTION);

        logger.debug('Department selection shown', {
            userId: ctx.from?.id,
            departmentsCount: departments.length,
            isChangingGroup,
        });
    } catch (error) {
        logger.error('Failed to show department selection', { error });
        throw error;
    }
}

// Обработчик выбора подразделения
export async function handleDepartmentSelection(ctx: BotContext): Promise<void> {
    if (!ctx.callbackQuery?.data) {
        return;
    }

    try {
        const { value } = parseCallbackData(ctx.callbackQuery.data);

        if (!value) {
            await ctx.answerCallbackQuery('Ошибка: некорректные данные');
            return;
        }

        const departmentId = validateDepartmentId(parseInt(value, 10));

        setSelectedDepartment(ctx, departmentId);
        setCurrentPage(ctx, 0); // Сбрасываем пагинацию

        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
            `${EMOJI.BUILDING} Подразделение выбрано\n\n${MESSAGES.COURSE_SELECTION.TEXT}`,
            { reply_markup: createCoursesKeyboard() }
        );

        updateSessionStep(ctx, RegistrationStep.COURSE_SELECTION);

        logger.info('Department selected', {
            userId: ctx.from?.id,
            departmentId,
        });
    } catch (error) {
        logger.error('Failed to handle department selection', { error });
        throw error;
    }
}

// Обработчик выбора курса
export async function handleCourseSelection(ctx: BotContext): Promise<void> {
    if (!ctx.callbackQuery?.data) {
        return;
    }

    const departmentId = ctx.session.selectedDepartmentId;

    if (!departmentId) {
        await ctx.answerCallbackQuery('Ошибка: сначала выберите подразделение');
        return;
    }

    try {
        const { value } = parseCallbackData(ctx.callbackQuery.data);

        if (!value) {
            await ctx.answerCallbackQuery('Ошибка: некорректные данные');
            return;
        }

        const course = validateCourse(parseInt(value, 10));

        setSelectedCourse(ctx, course);
        setCurrentPage(ctx, 0); // Сбрасываем пагинацию

        await ctx.answerCallbackQuery();

        // Загружаем группы для выбранного подразделения и курса
        await showGroupSelection(ctx, departmentId, course, 0);

        logger.info('Course selected', {
            userId: ctx.from?.id,
            departmentId,
            course,
        });
    } catch (error) {
        logger.error('Failed to handle course selection', { error });
        throw error;
    }
}

// Показать выбор группы
async function showGroupSelection(
    ctx: BotContext,
    departmentId: number,
    course: number,
    page: number
): Promise<void> {
    try {
        const groups = await getGroupsByDepartmentAndCourse(departmentId, course);

        if (groups.length === 0) {
            await ctx.editMessageText(
                '❌ Группы не найдены для выбранного курса.\n\nПопробуйте выбрать другой курс.',
                { reply_markup: createCoursesKeyboard() }
            );
            return;
        }

        const paginatedGroups = paginateItems(groups, page);

        await ctx.editMessageText(
            `${EMOJI.BOOK} Курс: ${course}\n\n${MESSAGES.GROUP_SELECTION.TEXT}`,
            { reply_markup: createGroupsKeyboard(paginatedGroups) }
        );

        updateSessionStep(ctx, RegistrationStep.GROUP_SELECTION);
        setCurrentPage(ctx, page);

        logger.debug('Group selection shown', {
            userId: ctx.from?.id,
            departmentId,
            course,
            page,
            totalGroups: groups.length,
        });
    } catch (error) {
        logger.error('Failed to show group selection', { error });
        throw error;
    }
}

// Обработчик выбора группы
export async function handleGroupSelection(ctx: BotContext): Promise<void> {
    if (!ctx.callbackQuery?.data) {
        return;
    }

    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!userId || !chatId) {
        await ctx.answerCallbackQuery('Ошибка: не удалось определить пользователя');
        return;
    }

    try {
        const { value } = parseCallbackData(ctx.callbackQuery.data);

        if (!value) {
            await ctx.answerCallbackQuery('Ошибка: некорректные данные');
            return;
        }

        const groupId = validateGroupId(parseInt(value, 10));
        const externalChatId = chatId.toString();

        // Проверяем, меняем ли мы группу из настроек
        const isChangingGroup = ctx.session.settings?.changingGroup === true;

        logger.debug('Group selection attempt', {
            userId,
            groupId,
            externalChatId,
            isChangingGroup,
        });

        if (isChangingGroup) {
            // Логика смены группы обрабатывается в callback.handler.ts
            // Здесь мы только логируем и продолжаем
            logger.debug('Group change detected, will be handled by callback handler');
            return;
        }

        // Первичная регистрация
        // Проверяем, не зарегистрирован ли уже этот чат
        const alreadyExists = await chatExists(externalChatId);

        if (alreadyExists) {
            await ctx.answerCallbackQuery('Этот чат уже зарегистрирован!');
            await ctx.editMessageText(
                '✅ Вы уже зарегистрированы!\n\n' +
                'Используйте /schedule для просмотра расписания.\n' +
                'Используйте /settings для изменения настроек.'
            );
            return;
        }

        // Получаем информацию о группе
        const group = await getGroupById(groupId);
        const existingSubscribers = await countChatsByGroupId(groupId);
        const shouldTriggerParser = existingSubscribers === 0;

        // Создаем запись в БД
        const chat = await createChat({
            groupid: groupId,
            name: ctx.chat?.title || ctx.from?.first_name || 'Unknown',
            externalchatid: externalChatId,
            notificationtime: '08:00:00',
            isnotificationenabled: true,
            notifyoneverylesson: false,
        });

        if (shouldTriggerParser) {
            await triggerGroupParsing(groupId);
        }

        setSelectedGroup(ctx, groupId);
        updateSessionStep(ctx, RegistrationStep.COMPLETED);

        await ctx.answerCallbackQuery(`${EMOJI.CHECK} Группа выбрана!`);
        await ctx.editMessageText(
            `${EMOJI.CHECK} Регистрация завершена!\n\n` +
            `${EMOJI.GROUP} Группа: ${group.name}\n` +
            `${EMOJI.BOOK} Курс: ${group.course}\n\n` +
            `${MESSAGES.SCHEDULE_READY.TEXT}`
        );

        logger.info('Registration completed', {
            userId,
            chatId: chat.chatid,
            groupId,
            groupName: group.name,
        });

        // Помечаем, что нужно отправить расписание только после первичной регистрации
        ctx.session.shouldSendSchedule = true;

    } catch (error) {
        logger.error('Failed to handle group selection', { error });
        throw error;
    }
}

// Обработчик навигации "Назад"
export async function handleNavigateBack(ctx: BotContext): Promise<void> {
    const currentStep = ctx.session.step;
    const isChangingGroup = ctx.session.settings?.changingGroup === true;

    await ctx.answerCallbackQuery();

    switch (currentStep) {
        case RegistrationStep.COURSE_SELECTION:
            // Возврат к выбору подразделения
            await showDepartmentSelection(ctx);
            break;

        case RegistrationStep.GROUP_SELECTION:
            // Возврат к выбору курса
            await ctx.editMessageText(MESSAGES.COURSE_SELECTION.TEXT, {
                reply_markup: createCoursesKeyboard(),
            });
            updateSessionStep(ctx, RegistrationStep.COURSE_SELECTION);
            break;

        default:
            if (isChangingGroup) {
                // Отменяем смену группы
                ctx.session.settings = undefined;
                await ctx.deleteMessage();
                await ctx.reply(
                    '❌ Смена группы отменена.\n\n' +
                    'Используйте /settings для повторной попытки.'
                );
            } else {
                await ctx.reply('Используйте /start для начала регистрации');
            }
            break;
    }

    logger.debug('Navigate back', {
        userId: ctx.from?.id,
        fromStep: currentStep,
        isChangingGroup,
    });
}

// Обработчик навигации по страницам групп
export async function handleGroupPagination(ctx: BotContext, page: number): Promise<void> {
    const departmentId = ctx.session.selectedDepartmentId;
    const course = ctx.session.selectedCourse;

    if (!departmentId || !course) {
        await ctx.answerCallbackQuery('Ошибка: данные сессии потеряны');
        return;
    }

    await ctx.answerCallbackQuery();
    await showGroupSelection(ctx, departmentId, course, page);

    logger.debug('Group pagination', {
        userId: ctx.from?.id,
        page,
        departmentId,
        course,
    });
}

// Вспомогательная функция для экспорта (используется в callback.handler)
export function isChangingGroupMode(ctx: BotContext): boolean {
    return ctx.session.settings?.changingGroup === true;
}