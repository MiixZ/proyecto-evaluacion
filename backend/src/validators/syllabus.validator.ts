import { z } from 'zod';
import { uuidSchema } from './common.validator';

export const createSyllabusSchema = z.object({
  courseId: uuidSchema,
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  contentType: z.enum(['module', 'topic', 'lesson']).default('module'),
  orderIndex: z.number().int().nonnegative().default(0),
  isPublic: z.boolean().default(true),
});

export const updateSyllabusSchema = createSyllabusSchema.partial().omit({ courseId: true });

export const createSyllabusRequest = z.object({
  body: createSyllabusSchema,
});

export const updateSyllabusRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateSyllabusSchema,
});

export const getSyllabusRequest = z.object({
  params: z.object({ id: uuidSchema }),
});

export type CreateSyllabusInput = z.infer<typeof createSyllabusSchema>;
export type UpdateSyllabusInput = z.infer<typeof updateSyllabusSchema>;