import { z } from 'zod';
import { uuidSchema } from './common.validator';

export const createSubmissionSchema = z.object({
  exerciseId: uuidSchema,
  courseId: uuidSchema,
  code: z.string().min(1, 'El código no puede estar vacío'),
  language: z.string(),
});

export const submitRouteSchema = z.object({
  body: createSubmissionSchema,
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const getSubmissionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
