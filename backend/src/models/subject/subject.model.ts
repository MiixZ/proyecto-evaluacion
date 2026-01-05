import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { SubjectEntity } from './subject.entity';
import { SubjectRow } from './subject.row';
import { subjectMapper } from '@mappers/subject.mapper';
import {
  CreateSubjectInput,
  UpdateSubjectInput,
} from '@validators/subject.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { NotFoundError, ValidationError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class SubjectModel {
  async create(input: CreateSubjectInput): Promise<SubjectEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO subjects (
        id, degree_id, name, code, description, docent_guide_url, semester, credits, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    try {
      await getPool().execute(query, [
        id,
        input.degreeId,
        input.name,
        input.code,
        input.description || null,
        input.docentGuideUrl || null,
        input.semester || null,
        input.credits,
        input.status,
      ]);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ValidationError(
          'El código de asignatura ya existe para esta titulación'
        );
      }
      throw error;
    }

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<SubjectEntity> {
    const [rows] = await getPool().execute<SubjectRow[]>(
      'SELECT * FROM subjects WHERE id = ?',
      [id]
    );

    if (rows.length === 0) throw new NotFoundError('Asignatura con id: ' + id);

    return subjectMapper.toEntity(rows[0]);
  }

  async update(id: UUID, input: UpdateSubjectInput): Promise<SubjectEntity> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.docentGuideUrl !== undefined) {
      updates.push('docent_guide_url = ?');
      values.push(input.docentGuideUrl);
    }
    if (input.semester !== undefined) {
      updates.push('semester = ?');
      values.push(input.semester);
    }
    if (input.credits !== undefined) {
      updates.push('credits = ?');
      values.push(input.credits);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`;
    await getPool().execute(query, values);

    return this.getById(id);
  }

  async list(
    page: number,
    limit: number,
    filters?: { degreeId?: string; status?: string }
  ): Promise<PaginatedResponse<SubjectEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.degreeId) {
      whereClause += ' AND degree_id = ?';
      params.push(filters.degreeId);
    }
    if (filters?.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    const countQuery = `SELECT COUNT(*) as count FROM subjects WHERE ${whereClause}`;
    const [countRows] = await getPool().query<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM subjects WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await getPool().query<SubjectRow[]>(query, params);
    const items = rows.map((row) => subjectMapper.toEntity(row));

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
      'SELECT 1 FROM subjects WHERE id = ?',
      [id]
    );

    return rows.length > 0;
  }
}

export const subjectModel = new SubjectModel();
