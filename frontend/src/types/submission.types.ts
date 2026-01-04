import { UUID } from "crypto";

export interface TestResultDTO {
  id: string;
  status: "passed" | "failed" | "error";
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTimeMs?: number;
  memoryUsedMb?: number;
  errorMessage?: string;
}

export interface SubmissionDetailDTO {
  userId: UUID;
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  exercise: {
    id: string;
    title: string;
    difficulty: "beginner" | "intermediate" | "advanced";
  };
  language: string;
  code: string;
  status: "pending" | "running" | "completed" | "failed";
  verdict:
    | "accepted"
    | "wrong_answer"
    | "time_limit"
    | "runtime_error"
    | "compilation_error"
    | "pending";
  score: number;
  executionTimeMs?: number;
  memoryUsedMb?: number;
  createdAt: string;
  testResults: TestResultDTO[];
}
