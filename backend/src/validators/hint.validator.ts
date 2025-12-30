import { z } from 'zod';
import { uuidSchema } from './common.validator';

export const requestHintSchema = z.object({
  params: z.object({
    submissionId: uuidSchema,
    testCaseId: uuidSchema,
  }),
});

export const requestHintRequest = requestHintSchema;
