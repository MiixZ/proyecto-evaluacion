import { z } from 'zod';
import { uuidSchema } from './common.validator';
import { FeedbackVisibility } from '@models/feedback/feedback.entity';

export const createFeedbackSchema = z.object({
  submissionId: uuidSchema,
  content: z.string().min(1, 'El comentario no puede estar vacío'),
  isGeneral: z.boolean().default(true),
  lineNumber: z.number().int().positive().optional().nullable(),
  scoreAdjustment: z.number().int().default(0),
  visibility: z
    .nativeEnum(FeedbackVisibility)
    .default(FeedbackVisibility.STUDENT),
});

export const updateFeedbackSchema = createFeedbackSchema
  .partial()
  .omit({ submissionId: true });

export const createFeedbackRequest = z.object({ body: createFeedbackSchema });

export const updateFeedbackRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateFeedbackSchema,
});

export const getFeedbackBySubmissionRequest = z.object({
  params: z.object({ submissionId: uuidSchema }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
