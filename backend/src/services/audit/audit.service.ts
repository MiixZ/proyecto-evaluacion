import { auditModel } from '@models/audit/audit.model';
import { CreateAuditInput } from '@validators/audit.validator';
import { UUID } from '@CustomTypes/common.types';

export class AuditService {
  /**
   * Método helper para registrar logs fácilmente desde otros servicios
   */
  async log(
    action: string,
    entityType: string,
    entityId: string | undefined,
    changes: Record<string, any> | undefined,
    actorId?: UUID,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const input: CreateAuditInput = {
        action,
        entityType,
        entityId: entityId || null,
        changes: changes || null,
        userId: actorId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      };
      await auditModel.create(input);
    } catch (error) {
      console.error('Error creando audit log:', error);
    }
  }

  async listLogs(
    page: number,
    limit: number,
    filters: {
      userId?: string;
      entityType?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    return await auditModel.list(page, limit, filters);
  }
}

export const auditService = new AuditService();
