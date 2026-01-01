import { type UUID, DifficultyLevel } from "./common";

export interface Syllabus {
  id: UUID;
  courseId: UUID;
  title: string;
  description?: string | null;
  orderIndex: number;
  isPublic: boolean;
}

export interface ExecutionLimit {
  timeLimitSeconds: number;
  memoryLimitMb: number;
}

export interface TestCase {
  id?: UUID;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  hintText?: string | null;
}

export interface Exercise {
  id: UUID;
  syllabusId: UUID;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: string;
  points: number;
  orderIndex?: number | null;
  templateCode?: string | null;
  isPublished: boolean;
  maxAttempts?: number;

  limits?: ExecutionLimit;
  testCases?: TestCase[];
}
