import { z } from 'zod';
import { uuidSchema, paginationSchema } from './common.validator';
import { CourseStatus } from '@CustomTypes/common.types';

export const createCourseSchema = z.object({
  subjectId: uuidSchema,
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Formato inválido (ej: 2024-2025)'),
  semester: z.number().int().min(1).max(2),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.PLANNING),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  migratedFrom: uuidSchema.optional(),
});

export const updateCourseSchema = createCourseSchema
  .partial()
  .omit({ subjectId: true, migratedFrom: true });

export const createCourseRequest = z.object({
  body: createCourseSchema,
});

export const updateCourseRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateCourseSchema,
});

export const getCourseRequest = z.object({
  params: z.object({ id: uuidSchema }),
});

export const listCoursesRequest = z.object({
  query: paginationSchema.extend({
    status: z.nativeEnum(CourseStatus).optional(),
    academicYear: z.string().optional(),
  }),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
