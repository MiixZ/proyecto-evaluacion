import z from 'zod';
import { languageCodeSchema, uuidSchema } from './common.validator';
import { DifficultyLevel, EfficiencyOrder } from '@CustomTypes/common.types';

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

export const createExerciseSchema = z.object({
  syllabusId: uuidSchema,
  title: z
    .string()
    .min(5, 'Título mínimo 5 caracteres')
    .max(255, 'Título máximo 255 caracteres')
    .describe('Título del ejercicio'),
  description: z
    .string()
    .min(20, 'Descripción mínimo 20 caracteres')
    .max(5000, 'Descripción máxima 5000 caracteres')
    .describe('Enunciado detallado'),
  difficulty: z
    .nativeEnum(DifficultyLevel)
    .default(DifficultyLevel.BEGINNER)
    .describe('Nivel de dificultad'),
  language: languageCodeSchema,
  templateCode: z
    .string()
    .optional()
    .nullable()
    .describe('Código plantilla/esqueleto'),
  orderIndex: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Orden en el temario'),
  points: z.number().int().positive().default(10).describe('Puntos máximos'),
  efficiencyOrder: z
    .nativeEnum(EfficiencyOrder)
    .default(EfficiencyOrder.ANY)
    .describe('Orden de eficiencia esperada'),
  deadline: z.coerce.date().optional().nullable().describe('Fecha límite'),
  lateSubmissionPenaltyPercent: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(0)
    .describe('Penalización por entrega tardía (%)'),
  maxAttempts: z
    .number()
    .int()
    .positive()
    .default(10)
    .describe('Máximo de intentos'),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
