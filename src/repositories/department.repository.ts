// src/repositories/department.repository.ts
// Repository для работы с таблицей Department

import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../types';
import type { Department } from '../types';

export async function getAllDepartments(): Promise<Department[]> {
    try {
        const departments = await db<Department[]>`
      SELECT 
        departmentid,
        name,
        url
      FROM Department
      ORDER BY name ASC
    `;

        logger.debug('Fetched all departments', { count: departments.length });
        return departments;
    } catch (error) {
        logger.error('Failed to fetch departments', { error });
        throw new DatabaseError('Failed to fetch departments', { error });
    }
}

export async function getDepartmentById(departmentId: number): Promise<Department> {
    try {
        const [department] = await db<Department[]>`
      SELECT 
        departmentid,
        name,
        url
      FROM Department
      WHERE departmentid = ${departmentId}
    `;

        if (!department) {
            throw new NotFoundError('Department', { departmentId });
        }

        logger.debug('Fetched department by ID', { departmentId });
        return department;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error('Failed to fetch department', { departmentId, error });
        throw new DatabaseError('Failed to fetch department', { departmentId, error });
    }
}

export async function departmentExists(departmentId: number): Promise<boolean> {
    try {
        const [result] = await db<[{ exists: boolean }]>`
      SELECT EXISTS(
        SELECT 1 FROM Department WHERE departmentid = ${departmentId}
      ) as exists
    `;

        return result?.exists ?? false;
    } catch (error) {
        logger.error('Failed to check department existence', { departmentId, error });
        throw new DatabaseError('Failed to check department existence', { departmentId, error });
    }
}