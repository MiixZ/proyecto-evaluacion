import z from 'zod';
import { languageCodeSchema, uuidSchema } from './common.validator';

export const createSubmissionSchema = z.object({
  exerciseId: uuidSchema,
  code: z
    .string()
    .min(1, 'Código no puede estar vacío')
    .max(100000, 'Código máximo 100KB')
    .describe('Código fuente'),
  language: languageCodeSchema,
});

export const submitRouteSchema = z.object({
  body: createSubmissionSchema.extend({
    courseId: z.string().uuid('Course ID inválido'),
  }),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

