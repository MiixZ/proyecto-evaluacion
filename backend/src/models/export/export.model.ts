import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { ExportEntity } from './export.entity';
import { ExportRow } from './export.row';
import { exportMapper } from '@mappers/export.mapper';
import { CreateExportInput } from '@validators/export.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class ExportModel {
  async create(
    input: CreateExportInput,
    filePath: string,
    fileSize: number,
    userId: UUID
  ): Promise<ExportEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO submission_exports (
        id, submission_id, export_format, export_path, purpose, 
        file_size_bytes, exported_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await getPool().execute(query, [
      id,
      input.submissionId,
      input.format,
      filePath,
      input.purpose,
      fileSize,
      userId,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<ExportEntity> {
    const [rows] = await getPool().execute<ExportRow[]>(
      'SELECT * FROM submission_exports WHERE id = ?',
      [id]
    );

    if (rows.length === 0) throw new NotFoundError('Exportación no encontrada');

    return exportMapper.toEntity(rows[0]);
  }

  async list(
    page: number,
    limit: number,
    filters?: { purpose?: string; format?: string }
  ): Promise<PaginatedResponse<ExportEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.purpose) {
      whereClause += ' AND purpose = ?';
      params.push(filters.purpose);
    }
    if (filters?.format) {
      whereClause += ' AND export_format = ?';
      params.push(filters.format);
    }

    const countQuery = `SELECT COUNT(*) as count FROM submission_exports WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM submission_exports WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [rows] = await getPool().execute<ExportRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);

    const items = rows.map((row) => exportMapper.toEntity(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const exportModel = new ExportModel();
