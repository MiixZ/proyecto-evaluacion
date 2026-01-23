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

export const exportSubmissionsSchema = z.object({
  groupId: uuidSchema,
  courseId: uuidSchema.optional(),
  syllabusId: uuidSchema.optional(),
  studentIds: z.array(uuidSchema).optional(),
});

export const exportSubmissionsRequest = z.object({
  body: exportSubmissionsSchema,
});

export type CreateExportInput = z.infer<typeof createExportSchema>;
