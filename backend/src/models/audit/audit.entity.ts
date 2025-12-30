import { UUID } from '@CustomTypes/common.types';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  EXPORT = 'EXPORT',
}

export interface AuditEntity {
  id: UUID;
  userId?: UUID | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface AuditDTO {
  id: UUID;
  userId?: UUID | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}
