import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { DegreeEntity } from './degree.entity';
import { DegreeRow } from './degree.row';
import { degreeMapper } from '@mappers/degree.mapper';
import {
  CreateDegreeInput,
  UpdateDegreeInput,
} from '@validators/degree.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { NotFoundError, ValidationError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class DegreeModel {
  async create(input: CreateDegreeInput): Promise<DegreeEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO degrees (
        id, name, code, description, duration_years, total_credits, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    try {
      await getPool().execute(query, [
        id,
        input.name,
        input.code,
        input.description || null,
        input.durationYears,
        input.totalCredits,
        input.status,
      ]);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ValidationError('El código o nombre de titulación ya existe');
      }
      throw error;
    }

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<DegreeEntity> {
    const [rows] = await getPool().execute<DegreeRow[]>(
      'SELECT * FROM degrees WHERE id = ?',
      [id]
    );

    if (rows.length === 0) throw new NotFoundError('Titulación con id: ' + id);

    return degreeMapper.toEntity(rows[0]);
  }

  async update(id: UUID, input: UpdateDegreeInput): Promise<DegreeEntity> {
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
    if (input.durationYears !== undefined) {
      updates.push('duration_years = ?');
      values.push(input.durationYears);
    }
    if (input.totalCredits !== undefined) {
      updates.push('total_credits = ?');
      values.push(input.totalCredits);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE degrees SET ${updates.join(', ')} WHERE id = ?`;
    await getPool().execute(query, values);

    return this.getById(id);
  }

  async list(
    page: number,
    limit: number,
    filters?: { status?: string; search?: string }
  ): Promise<PaginatedResponse<DegreeEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.search) {
      whereClause += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const countQuery = `SELECT COUNT(*) as count FROM degrees WHERE ${whereClause}`;
    const [countRows] = await getPool().query<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM degrees WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await getPool().query<DegreeRow[]>(query, params);
    const items = rows.map((row) => degreeMapper.toEntity(row));

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
    const [rows] = await getPool().execute<DegreeRow[]>(
      'SELECT 1 FROM degrees WHERE id = ?',
      [id]
    );

    return rows.length > 0;
  }
}

export const degreeModel = new DegreeModel();
