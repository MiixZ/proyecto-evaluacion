/**
 * UUID v4 (36 caracteres)
 */
export type UUID = string & { readonly __brand: 'UUID' };

/**
 * Constructor de UUID (en realidad es string, pero con validación)
 */
export function createUUID(id: string): UUID {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    throw new Error(`ID inválido: ${id}`);
  }

  return id as UUID;
}

/**
 * Usuario autenticado (para req.user)
 */
export interface AuthUser {
  id: UUID;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

/**
 * Enums comunes
 */
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum SubmissionVerdict {
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  RUNTIME_ERROR = 'runtime_error',
  TIME_LIMIT = 'time_limit',
  COMPILATION_ERROR = 'compilation_error',
  MEMORY_LIMIT = 'memory_limit',
  PENDING = 'pending',
  PLAGIARISM = 'plagiarism',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TestCaseStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  ERROR = 'error',
}

export enum EfficiencyOrder {
  BEST = 'best',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  ANY = 'any',
}

export enum PlagiarismType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  AI_GENERATED = 'ai_generated',
  BEHAVIORAL = 'behavioral',
}

export enum CourseStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum ExercisePublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export const LanguageTypes = ['es', 'en'] as const;
export type LanguageType = (typeof LanguageTypes)[number];

/**
 * Interfaz base para respuestas API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Interfaz para paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Interfaz para timestamps
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Interfaz para auditoría
 */
export interface AuditInfo {
  createdBy?: UUID;
  updatedBy?: UUID;
  deletedBy?: UUID;
}

/**
 * QueryOptions para getAll/list
 */
export interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: {
    field: string;
    direction: 'ASC' | 'DESC';
  }[];
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

/**
 * Helper para crear respuestas exitosas
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper para crear respuestas de error
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse<null> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}
