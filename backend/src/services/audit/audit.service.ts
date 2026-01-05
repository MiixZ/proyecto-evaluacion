import { auditModel } from '@models/audit/audit.model';
import { CreateAuditInput } from '@validators/audit.validator';
import { UUID } from '@CustomTypes/common.types';

/**
 * Servicio de auditoría para registro de acciones del sistema
 * Mantiene trazabilidad de operaciones críticas
 */
export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   * @param action - Acción realizada (LOGIN, CREATE_USER, etc.)
   * @param entityType - Tipo de entidad afectada
   * @param entityId - ID de la entidad afectada
   * @param changes - Cambios realizados
   * @param actorId - ID del usuario que realiza la acción
   * @param ipAddress - Dirección IP del cliente
   * @param userAgent - User agent del navegador
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

  /**
   * Lista registros de auditoría con filtros y paginación
   * @param page - Número de página
   * @param limit - Resultados por página
   * @param filters - Filtros de búsqueda
   * @returns Respuesta paginada con logs de auditoría
   */
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
