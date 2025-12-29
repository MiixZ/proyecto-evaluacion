import { BaseMapper } from '@utils/mapper';
import { AuditEntity, AuditDTO } from '@models/audit/audit.entity';
import { AuditRow } from '@models/audit/audit.row';
import { UUID } from '@CustomTypes/common.types';

class AuditMapper extends BaseMapper<AuditEntity, AuditDTO, AuditRow> {
  toEntity(row: AuditRow): AuditEntity {
    return {
      id: row.id as UUID,
      userId: row.user_id ? (row.user_id as UUID) : null,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      changes:
        typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: new Date(row.created_at),
    };
  }

  toDTO(entity: AuditEntity): AuditDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      action: entity.action,
      entityType: entity.entityType,
      entityId: entity.entityId,
      changes: entity.changes,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
    };
  }
}

export const auditMapper = new AuditMapper();
