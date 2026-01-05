/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditFilters {
  userId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

class AuditService {
  async getAuditLogs(
    page: number = 1,
    limit: number = 20,
    filters?: AuditFilters
  ): Promise<AuditLogsResponse> {
    const params: any = { page, limit };

    if (filters?.userId) params.userId = filters.userId;
    if (filters?.entityType) params.entityType = filters.entityType;
    if (filters?.action) params.action = filters.action;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const response = await api.get("/v1/audit", { params });
    return response.data.data;
  }
}

export const auditService = new AuditService();
