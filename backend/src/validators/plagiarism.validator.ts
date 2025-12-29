import { z } from 'zod';
import { uuidSchema, paginationSchema, urlSchema } from './common.validator';
import { PlagiarismType } from '@CustomTypes/common.types';

// Esquema para registrar un chequeo manual o automático
export const createPlagiarismCheckSchema = z.object({
  submissionId: uuidSchema,
  comparedWithSubmissionId: uuidSchema,
  similarityPercent: z.number().min(0).max(100),
  plagiarismType: z.nativeEnum(PlagiarismType).default(PlagiarismType.INTERNAL),
  toolUsed: z.string().optional(),
  toolReportUrl: urlSchema.optional(),
  isFlagged: z.boolean().default(false),
  notes: z.string().optional(),
});

export const reviewPlagiarismSchema = z.object({
  isFlagged: z.boolean(),
  notes: z.string().optional(),
});

export const createPlagiarismCheckRequest = z.object({
  body: createPlagiarismCheckSchema,
});

export const reviewPlagiarismRequest = z.object({
  params: z.object({ id: uuidSchema }),
  body: reviewPlagiarismSchema,
});

export const getBySubmissionRequest = z.object({
  params: z.object({ submissionId: uuidSchema }),
});

export const listPlagiarismRequest = z.object({
  query: paginationSchema.extend({
    isFlagged: z.enum(['true', 'false']).optional(),
    type: z.nativeEnum(PlagiarismType).optional(),
  }),
});

export type CreatePlagiarismCheckInput = z.infer<
  typeof createPlagiarismCheckSchema
>;
export type ReviewPlagiarismInput = z.infer<typeof reviewPlagiarismSchema>;
