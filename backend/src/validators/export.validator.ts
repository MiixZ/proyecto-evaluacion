import { z } from 'zod';
import { uuidSchema, paginationSchema } from './common.validator';
import { ExportFormat, ExportPurpose } from '@models/export/export.entity';

export const createExportSchema = z.object({
  submissionId: uuidSchema,
  format: z.nativeEnum(ExportFormat).default(ExportFormat.JSON),
  purpose: z.nativeEnum(ExportPurpose).default(ExportPurpose.ANALYSIS),
});

export const createExportRequest = z.object({ body: createExportSchema });

export const getExportRequest = z.object({
  params: z.object({ id: uuidSchema }),
});

export const listExportsRequest = z.object({
  query: paginationSchema.extend({
    purpose: z.nativeEnum(ExportPurpose).optional(),
    format: z.nativeEnum(ExportFormat).optional(),
  }),
});

export type CreateExportInput = z.infer<typeof createExportSchema>;
