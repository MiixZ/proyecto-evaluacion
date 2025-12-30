import { z } from 'zod';
import { uuidSchema, paginationSchema, urlSchema } from './common.validator';

export const createSubjectSchema = z.object({
  degreeId: uuidSchema,
  name: z.string().min(3).max(255),
  code: z.string().min(2).max(50),
  description: z.string().optional(),
  docentGuideUrl: urlSchema.optional(),
  semester: z.number().int().min(1).max(8).optional(),
  credits: z.number().int().positive().default(6),
  status: z.enum(['active', 'archived']).default('active'),
});

export const updateSubjectSchema = createSubjectSchema
  .partial()
  .omit({ degreeId: true, code: true });

export const createSubjectRequest = z.object({ body: createSubjectSchema });
export const updateSubjectRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateSubjectSchema,
});
export const getSubjectRequest = z.object({
  params: z.object({ id: uuidSchema }),
});
export const listSubjectsRequest = z.object({
  query: paginationSchema.extend({
    degreeId: uuidSchema.optional(),
    status: z.enum(['active', 'archived']).optional(),
  }),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
