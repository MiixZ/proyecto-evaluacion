import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  DifficultyLevel,
  SubmissionVerdict,
  SubmissionStatus,
  EfficiencyOrder,
} from '@CustomTypes/common.types';

/**
 * ============================================================================
 * VALIDATORS BASE
 * ============================================================================
 */

/**
 * UUID regex validator
 */
const uuidSchema = z
  .string()
  .uuid('ID inválido, debe ser UUID v4')
  .describe('Identificador único (UUID v4)');

/**
 * Email validator
 */
const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .describe('Dirección de correo electrónico');

/**
 * Password validator (mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número)
 */
const passwordSchema = z
  .string()
  .min(8, 'Contraseña debe tener mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Contraseña debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Contraseña debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Contraseña debe contener al menos un número')
  .describe('Contraseña segura');

/**
 * Phone validator (formato internacional básico)
 */
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
  .optional()
  .nullable()
  .describe('Número de teléfono en formato internacional');

/**
 * URL validator
 */
const urlSchema = z
  .string()
  .url('URL inválida')
  .optional()
  .nullable()
  .describe('URL válida');

/**
 * Código de lenguaje
 */
const languageCodeSchema = z
  .enum([
    'python',
    'java',
    'javascript',
    'cpp',
    'go',
    'rust',
    'c',
    'typescript',
  ])
  .describe('Código del lenguaje de programación');

/**
 * ============================================================================
 * USER SCHEMAS
 * ============================================================================
 */

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'Nombre es requerido')
    .max(100, 'Nombre máximo 100 caracteres')
    .describe('Nombre de pila'),
  lastName: z
    .string()
    .min(1, 'Apellido es requerido')
    .max(100, 'Apellido máximo 100 caracteres')
    .describe('Apellidos'),
  role: z
    .nativeEnum(UserRole)
    .default(UserRole.STUDENT)
    .describe('Rol del usuario'),
  phone: phoneSchema,
  bio: z
    .string()
    .max(500, 'Bio máximo 500 caracteres')
    .optional()
    .nullable()
    .describe('Biografía o descripción'),
  profileImageUrl: urlSchema,
  preferredLanguage: z
    .enum(['es', 'en'])
    .default('es')
    .describe('Idioma preferido'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userResponseSchema = createUserSchema
  .omit({ password: true })
  .extend({
    id: uuidSchema,
    authId: z.string().describe('ID de Authgear'),
    status: z.nativeEnum(UserStatus),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().optional().nullable(),
  });

export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * ============================================================================
 * DEGREE SCHEMAS (Titulaciones)
 * ============================================================================
 */

export const createDegreeSchema = z.object({
  name: z
    .string()
    .min(3, 'Nombre mínimo 3 caracteres')
    .max(255, 'Nombre máximo 255 caracteres')
    .describe('Nombre de la titulación'),
  code: z
    .string()
    .min(2, 'Código mínimo 2 caracteres')
    .max(50, 'Código máximo 50 caracteres')
    .toUpperCase()
    .optional()
    .describe('Código oficial'),
  description: z
    .string()
    .max(1000, 'Descripción máxima 1000 caracteres')
    .optional()
    .nullable()
    .describe('Descripción de la titulación'),
  durationYears: z
    .number()
    .int()
    .positive('Duración debe ser positiva')
    .default(4)
    .describe('Duración en años'),
  totalCredits: z
    .number()
    .int()
    .positive('Créditos debe ser positivo')
    .default(240)
    .describe('Total de créditos ECTS'),
});

export type CreateDegreeInput = z.infer<typeof createDegreeSchema>;

export const degreeResponseSchema = createDegreeSchema.extend({
  id: uuidSchema,
  status: z.enum(['active', 'archived']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type DegreeResponse = z.infer<typeof degreeResponseSchema>;

/**
 * ============================================================================
 * EXERCISE SCHEMAS
 * ============================================================================
 */

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

export const exerciseResponseSchema = createExerciseSchema.extend({
  id: uuidSchema,
  createdBy: uuidSchema,
  isPublished: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ExerciseResponse = z.infer<typeof exerciseResponseSchema>;

/**
 * ============================================================================
 * SUBMISSION SCHEMAS
 * ============================================================================
 */

export const createSubmissionSchema = z.object({
  exerciseId: uuidSchema,
  code: z
    .string()
    .min(1, 'Código no puede estar vacío')
    .max(100000, 'Código máximo 100KB')
    .describe('Código fuente'),
  language: languageCodeSchema,
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const submissionResponseSchema = z.object({
  id: uuidSchema,
  exerciseId: uuidSchema,
  studentId: uuidSchema,
  courseId: uuidSchema,
  attemptNumber: z.number().int().positive(),
  code: z.string(),
  language: languageCodeSchema,
  status: z.nativeEnum(SubmissionStatus),
  verdict: z.nativeEnum(SubmissionVerdict),
  score: z.number().int().min(0),
  isLate: z.boolean(),
  usedHint: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;

/**
 * ============================================================================
 * TEST CASE SCHEMAS
 * ============================================================================
 */

export const createTestCaseSchema = z.object({
  exerciseId: uuidSchema,
  input: z
    .string()
    .min(1, 'Input no puede estar vacío')
    .describe('Entrada estándar (stdin)'),
  expectedOutput: z
    .string()
    .min(1, 'Output no puede estar vacío')
    .describe('Salida esperada (stdout)'),
  isHidden: z.boolean().default(false).describe('Caso oculto para estudiantes'),
  orderIndex: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Orden de ejecución'),
  timeLimitSeconds: z
    .number()
    .int()
    .positive()
    .default(5)
    .describe('Límite tiempo (segundos)'),
  memoryLimitMb: z
    .number()
    .int()
    .positive()
    .default(256)
    .describe('Límite memoria (MB)'),
  efficiencyOrder: z
    .nativeEnum(EfficiencyOrder)
    .default(EfficiencyOrder.ANY)
    .describe('Orden eficiencia esperada'),
  hintText: z.string().optional().nullable().describe('Pista si falla el test'),
  hintPenaltyPercent: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(10)
    .describe('Penalización por usar pista (%)'),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;

/**
 * ============================================================================
 * FEEDBACK SCHEMAS
 * ============================================================================
 */

export const createFeedbackSchema = z.object({
  submissionId: uuidSchema,
  content: z
    .string()
    .min(5, 'Feedback mínimo 5 caracteres')
    .max(2000, 'Feedback máximo 2000 caracteres')
    .describe('Contenido del feedback'),
  isGeneral: z.boolean().default(true).describe('¿Feedback general?'),
  lineNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .describe('Número de línea si es específico'),
  scoreAdjustment: z
    .number()
    .int()
    .min(-10)
    .max(10)
    .default(0)
    .describe('Ajuste de puntuación'),
  visibility: z
    .enum(['private', 'student', 'group', 'public'])
    .default('student')
    .describe('Visibilidad del feedback'),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

/**
 * ============================================================================
 * PAGINATION & QUERY SCHEMAS
 * ============================================================================
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Helper para validar sin lanzar excepciones
 * Retorna { success: true, data: T } o { success: false, errors: ZodIssue[] }
 */
export function validateSafe<T>(
  schema: z.ZodSchema,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

/**
 * Helper para validar y lanzar excepciones
 */
export function validate<T>(schema: z.ZodSchema, data: unknown): T {
  return schema.parse(data);
}
