import z from 'zod';
import { languageCodeSchema, uuidSchema } from './common.validator';
import { DifficultyLevel, EfficiencyOrder } from '@CustomTypes/common.types';

const createTestCaseInputSchema = z.object({
  input: z.string(),
  expectedOutput: z.string().min(1, 'El output esperado es requerido'),
  runnerCode: z.string().optional().nullable(),
  isHidden: z.boolean().default(false),
  timeLimitSeconds: z.number().int().positive().default(5),
  memoryLimitMb: z.number().int().positive().default(256),
  hintText: z.string().optional().nullable(),
  hintPenaltyPercent: z.number().int().min(0).max(100).default(0),
  availableFrom: z.coerce.date().optional().nullable(),
});

const createExecutionLimitInputSchema = z.object({
  timeLimitSeconds: z.number().int().positive().default(5),
  memoryLimitMb: z.number().int().positive().default(256),
});

export const createExerciseSchema = z.object({
  syllabusId: uuidSchema,
  title: z
    .string()
    .min(5, 'Título mínimo 5 caracteres')
    .max(255, 'Título máximo 255 caracteres'),
  description: z.string().min(20, 'Descripción mínima 20 caracteres'),
  difficulty: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.BEGINNER),
  language: languageCodeSchema,
  templateCode: z.string().optional().nullable(),
  orderIndex: z.number().int().positive().optional(),
  points: z.number().int().positive().default(10),
  efficiencyOrder: z.nativeEnum(EfficiencyOrder).default(EfficiencyOrder.ANY),
  deadline: z.coerce.date().optional().nullable(),
  lateDeadline: z.coerce.date().optional().nullable(),
  lateSubmissionPenaltyPercent: z.number().int().min(0).max(100).default(0),
  maxAttempts: z.number().int().positive().default(10),
  testCases: z
    .array(createTestCaseInputSchema)
    .min(1, 'Debe haber al menos un caso de prueba'),
  limits: createExecutionLimitInputSchema.optional(),
});

export const createExerciseRequest = z.object({
  body: createExerciseSchema,
});

export const publishExerciseRequest = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    isPublished: z.boolean(),
  }),
});

export const getExerciseRequest = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const getExercisesBySyllabusRequest = z.object({
  params: z.object({
    syllabusId: uuidSchema,
  }),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
