export type UUID = string;

export enum UserRole {
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum DifficultyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum SubmissionVerdict {
  ACCEPTED = "accepted",
  WRONG_ANSWER = "wrong_answer",
  RUNTIME_ERROR = "runtime_error",
  TIME_LIMIT = "time_limit",
  COMPILATION_ERROR = "compilation_error",
  MEMORY_LIMIT = "memory_limit",
  PENDING = "pending",
}

export enum SubmissionStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum CourseStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum ExercisePublishStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

export enum EfficiencyOrder {
  BEST = "best",
  GOOD = "good",
  ACCEPTABLE = "acceptable",
  ANY = "any",
}

export enum PlagiarismType {
  INTERNAL = "internal",
  EXTERNAL = "external",
  AI_GENERATED = "ai_generated",
}

export const LanguageTypes = ["es", "en"] as const;
