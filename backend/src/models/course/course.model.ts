import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { CourseEntity } from './course.entity';
import { CourseRow } from './course.row';
import { courseMapper } from '@mappers/course.mapper';
import {
  CreateCourseInput,
  UpdateCourseInput,
} from '@validators/course.validator';
import {
  UUID,
  PaginatedResponse,
  CourseStatus,
} from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class CourseModel {
  async create(input: CreateCourseInput): Promise<CourseEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO courses (
        id, subject_id, academic_year, semester, status, start_date, end_date, migrated_from, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await getPool().execute(query, [
      id,
      input.subjectId,
      input.academicYear,
      input.semester,
      input.status,
      input.startDate || null,
      input.endDate || null,
      input.migratedFrom || null,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<CourseEntity> {
    const [rows] = await getPool().execute<CourseRow[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );
    if (rows.length === 0) throw new NotFoundError('Curso no encontrado');
    return courseMapper.toEntity(rows[0]);
  }

  async update(id: UUID, input: UpdateCourseInput): Promise<CourseEntity> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.academicYear) {
      updates.push('academic_year = ?');
      values.push(input.academicYear);
    }
    if (input.semester) {
      updates.push('semester = ?');
      values.push(input.semester);
    }
    if (input.status) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.startDate !== undefined) {
      updates.push('start_date = ?');
      values.push(input.startDate);
    }
    if (input.endDate !== undefined) {
      updates.push('end_date = ?');
      values.push(input.endDate);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`;
    await getPool().execute(query, values);

    return this.getById(id);
  }

  async list(
    page: number,
    limit: number,
    filters?: { status?: CourseStatus; academicYear?: string }
  ): Promise<PaginatedResponse<CourseEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.academicYear) {
      whereClause += ' AND academic_year = ?';
      params.push(filters.academicYear);
    }

    const countQuery = `SELECT COUNT(*) as count FROM courses WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM courses WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [rows] = await getPool().execute<CourseRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);
    const items = rows.map((row) => courseMapper.toEntity(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exists(id: UUID): Promise<boolean> {
    const [rows] = await getPool().execute<any[]>(
      'SELECT 1 FROM courses WHERE id = ?',
      [id]
    );
    return rows.length > 0;
  }
}

export const courseModel = new CourseModel();
