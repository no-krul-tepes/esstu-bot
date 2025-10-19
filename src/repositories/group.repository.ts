// src/repositories/group.repository.ts
// Repository для работы с таблицей Group

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../types/errors.js';
import type { Group, GroupFilter } from '../types/database.js';

export async function getGroupsByFilter(filter: GroupFilter): Promise<Group[]> {
    try {
        let query;

        // Строим запрос динамически на основе фильтров
        if (filter.departmentId && filter.course !== undefined && filter.isActive !== undefined) {
            query = db<Group[]>`
        SELECT 
          groupid,
          institutionid,
          departmentid,
          name,
          course,
          url,
          dateadded,
          isactive
        FROM "Group"
        WHERE departmentid = ${filter.departmentId}
          AND course = ${filter.course}
          AND isactive = ${filter.isActive}
        ORDER BY name ASC
      `;
        } else if (filter.departmentId && filter.course !== undefined) {
            query = db<Group[]>`
        SELECT 
          groupid,
          institutionid,
          departmentid,
          name,
          course,
          url,
          dateadded,
          isactive
        FROM "Group"
        WHERE departmentid = ${filter.departmentId}
          AND course = ${filter.course}
        ORDER BY name ASC
      `;
        } else if (filter.departmentId) {
            query = db<Group[]>`
        SELECT 
          groupid,
          institutionid,
          departmentid,
          name,
          course,
          url,
          dateadded,
          isactive
        FROM "Group"
        WHERE departmentid = ${filter.departmentId}
        ORDER BY name ASC
      `;
        } else if (filter.course !== undefined) {
            query = db<Group[]>`
        SELECT 
          groupid,
          institutionid,
          departmentid,
          name,
          course,
          url,
          dateadded,
          isactive
        FROM "Group"
        WHERE course = ${filter.course}
        ORDER BY name ASC
      `;
        } else if (filter.isActive !== undefined) {
            query = db<Group[]>`
        SELECT 
          groupid,
          institutionid,
          departmentid,
          name,
          course,
          url,
          dateadded,
          isactive
        FROM "Group"
        WHERE isactive = ${filter.isActive}
        ORDER BY name ASC
      `;
        } else {
            query = db<Group[]>`
        SELECT 
          groupid,
          institutionid,
          departmentid,
          name,
          course,
          url,
          dateadded,
          isactive
        FROM "Group"
        ORDER BY name ASC
      `;
        }

        const groups = await query;

        logger.debug('Fetched groups by filter', { filter, count: groups.length });
        return groups;
    } catch (error) {
        logger.error('Failed to fetch groups', { filter, error });
        throw new DatabaseError('Failed to fetch groups', { filter, error });
    }
}

export async function getGroupById(groupId: number): Promise<Group> {
    try {
        const [group] = await db<Group[]>`
      SELECT 
        groupid,
        institutionid,
        departmentid,
        name,
        course,
        url,
        dateadded,
        isactive
      FROM "Group"
      WHERE groupid = ${groupId}
    `;

        if (!group) {
            throw new NotFoundError('Group', { groupId });
        }

        logger.debug('Fetched group by ID', { groupId });
        return group;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error('Failed to fetch group', { groupId, error });
        throw new DatabaseError('Failed to fetch group', { groupId, error });
    }
}

export async function getGroupsByDepartmentAndCourse(
    departmentId: number,
    course: number
): Promise<Group[]> {
    return getGroupsByFilter({
        departmentId,
        course,
        isActive: true,
    });
}

export async function countGroupsByFilter(filter: GroupFilter): Promise<number> {
    try {
        let query;

        if (filter.departmentId && filter.course !== undefined && filter.isActive !== undefined) {
            query = db<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM "Group"
        WHERE departmentid = ${filter.departmentId}
          AND course = ${filter.course}
          AND isactive = ${filter.isActive}
      `;
        } else if (filter.departmentId && filter.course !== undefined) {
            query = db<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM "Group"
        WHERE departmentid = ${filter.departmentId}
          AND course = ${filter.course}
      `;
        } else if (filter.departmentId) {
            query = db<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM "Group"
        WHERE departmentid = ${filter.departmentId}
      `;
        } else if (filter.course !== undefined) {
            query = db<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM "Group"
        WHERE course = ${filter.course}
      `;
        } else if (filter.isActive !== undefined) {
            query = db<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM "Group"
        WHERE isactive = ${filter.isActive}
      `;
        } else {
            query = db<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM "Group"
      `;
        }

        const result = await query;
        const count = parseInt(result[0]?.count ?? '0', 10);

        logger.debug('Counted groups by filter', { filter, count });
        return count;
    } catch (error) {
        logger.error('Failed to count groups', { filter, error });
        throw new DatabaseError('Failed to count groups', { filter, error });
    }
}

export async function groupExists(groupId: number): Promise<boolean> {
    try {
        const [result] = await db<[{ exists: boolean }]>`
      SELECT EXISTS(
        SELECT 1 FROM "Group" WHERE groupid = ${groupId}
      ) as exists
    `;

        return result?.exists ?? false;
    } catch (error) {
        logger.error('Failed to check group existence', { groupId, error });
        throw new DatabaseError('Failed to check group existence', { groupId, error });
    }
}