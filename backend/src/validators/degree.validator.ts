import { z } from 'zod';
import { uuidSchema, paginationSchema } from './common.validator';

export const createDegreeSchema = z.object({
  name: z.string().min(3).max(255),
  code: z.string().min(2).max(50),
  description: z.string().optional(),
  durationYears: z.number().int().positive().max(6).default(4),
  totalCredits: z.number().int().positive().max(360).default(240),
  status: z.enum(['active', 'archived']).default('active'),
});

export const updateDegreeSchema = createDegreeSchema
  .partial()
  .omit({ code: true });

export const createDegreeRequest = z.object({ body: createDegreeSchema });
export const updateDegreeRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateDegreeSchema,
});
export const getDegreeRequest = z.object({
  params: z.object({ id: uuidSchema }),
});
export const listDegreesRequest = z.object({
  query: paginationSchema.extend({
    status: z.enum(['active', 'archived']).optional(),
    search: z.string().optional(),
  }),
});

export type CreateDegreeInput = z.infer<typeof createDegreeSchema>;
export type UpdateDegreeInput = z.infer<typeof updateDegreeSchema>;
