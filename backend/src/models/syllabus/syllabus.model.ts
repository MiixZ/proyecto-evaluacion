import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { SyllabusEntity } from './syllabus.entity';
import { SyllabusRow } from './syllabus.row';
import { syllabusMapper } from '@mappers/syllabus.mapper';
import {
  CreateSyllabusInput,
  UpdateSyllabusInput,
} from '@validators/syllabus.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class SyllabusModel {
  async create(input: CreateSyllabusInput): Promise<SyllabusEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO syllabi (
        id, course_id, title, description, content_type, order_index, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await getPool().execute(query, [
      id,
      input.courseId,
      input.title,
      input.description || null,
      input.contentType,
      input.orderIndex,
      input.isPublic,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<SyllabusEntity> {
    const [rows] = await getPool().execute<SyllabusRow[]>(
      'SELECT * FROM syllabi WHERE id = ?',
      [id]
    );
    if (rows.length === 0) throw new NotFoundError('Temario con id: ' + id);

    return syllabusMapper.toEntity(rows[0]);
  }

  async update(id: UUID, input: UpdateSyllabusInput): Promise<SyllabusEntity> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.contentType !== undefined) {
      updates.push('content_type = ?');
      values.push(input.contentType);
    }
    if (input.orderIndex !== undefined) {
      updates.push('order_index = ?');
      values.push(input.orderIndex);
    }
    if (input.isPublic !== undefined) {
      updates.push('is_public = ?');
      values.push(input.isPublic);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE syllabi SET ${updates.join(', ')} WHERE id = ?`;

    const [result] = await getPool().execute(query, values);
    // @ts-ignore - access info property if needed, but not strictly required
    if (result.affectedRows === 0)
      throw new NotFoundError('Temario con id: ' + id);

    return this.getById(id);
  }

  async list(
    page: number,
    limit: number,
    filters?: { courseId?: string }
  ): Promise<PaginatedResponse<SyllabusEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.courseId) {
      whereClause += ' AND course_id = ?';
      params.push(filters.courseId);
    }

    const countQuery = `SELECT COUNT(*) as count FROM syllabi WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM syllabi 
      WHERE ${whereClause} 
      ORDER BY course_id, order_index ASC 
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const [rows] = await getPool().execute<SyllabusRow[]>(query, params);
    const items = rows.map((row) => syllabusMapper.toEntity(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByCourse(courseId: UUID): Promise<SyllabusEntity[]> {
    const [rows] = await getPool().execute<SyllabusRow[]>(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM exercises WHERE syllabus_id = s.id) as exercises_count
       FROM syllabi s 
       WHERE s.course_id = ? 
       ORDER BY s.order_index ASC`,
      [courseId]
    );
    return rows.map((row) => syllabusMapper.toEntity(row));
  }

  async exists(id: UUID): Promise<boolean> {
    const [rows] = await getPool().execute<any[]>(
      'SELECT 1 FROM syllabi WHERE id = ?',
      [id]
    );
    return rows.length > 0;
  }

  async getExerciseCount(id: UUID): Promise<number> {
    const [rows] = await getPool().execute<CountResult[]>(
      'SELECT COUNT(*) as count FROM exercises WHERE syllabus_id = ?',
      [id]
    );
    return rows[0].count;
  }

  async delete(id: UUID): Promise<void> {
    const [result] = await getPool().execute(
      'DELETE FROM syllabi WHERE id = ?',
      [id]
    );
    // @ts-ignore
    if (result.affectedRows === 0) {
      throw new NotFoundError('Temario con id: ' + id);
    }
  }
}

export const syllabusModel = new SyllabusModel();
