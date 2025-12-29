import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { AuditEntity } from './audit.entity';
import { AuditRow } from './audit.row';
import { auditMapper } from '@mappers/audit.mapper';
import { CreateAuditInput } from '@validators/audit.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

export class AuditModel {
  async create(input: CreateAuditInput): Promise<AuditEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id, changes, 
        ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const changesVal = input.changes ? JSON.stringify(input.changes) : null;

    await getPool().execute(query, [
      id,
      input.userId || null,
      input.action,
      input.entityType,
      input.entityId || null,
      changesVal,
      input.ipAddress || null,
      input.userAgent || null,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<AuditEntity> {
    const [rows] = await getPool().execute<AuditRow[]>(
      'SELECT * FROM audit_logs WHERE id = ?',
      [id]
    );
    if (rows.length === 0)
      throw new NotFoundError('Log de auditoría no encontrado');
    return auditMapper.toEntity(rows[0]);
  }

  async list(
    page: number,
    limit: number,
    filters?: {
      userId?: string;
      entityType?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PaginatedResponse<AuditEntity>> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.userId) {
      whereClause += ' AND user_id = ?';
      params.push(filters.userId);
    }
    if (filters?.entityType) {
      whereClause += ' AND entity_type = ?';
      params.push(filters.entityType);
    }
    if (filters?.action) {
      whereClause += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters?.startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(new Date(filters.startDate));
    }
    if (filters?.endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(new Date(filters.endDate));
    }

    const countQuery = `SELECT COUNT(*) as count FROM audit_logs WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<CountResult[]>(
      countQuery,
      params
    );
    const total = countRows[0].count;

    const offset = (page - 1) * limit;
    const query = `SELECT * FROM audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [rows] = await getPool().execute<AuditRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);
    const items = rows.map((row) => auditMapper.toEntity(row));

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

export const auditModel = new AuditModel();
