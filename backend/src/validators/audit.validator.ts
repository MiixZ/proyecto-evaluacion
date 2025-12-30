import { z } from 'zod';
import { uuidSchema, paginationSchema } from './common.validator';

export const createAuditSchema = z.object({
  userId: uuidSchema.optional().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional().nullable(),
  changes: z.record(z.any()).optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const listAuditRequest = z.object({
  query: paginationSchema.extend({
    userId: uuidSchema.optional(),
    entityType: z.string().optional(),
    action: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
