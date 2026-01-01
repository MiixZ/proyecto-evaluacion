import { type UUID, SubmissionStatus, SubmissionVerdict } from "./common";

export interface TestResult {
  id: UUID;
  testCaseId: UUID;
  status: "passed" | "failed" | "error" | "timeout";
  actualOutput: string;
  executionTimeMs: number;
  memoryUsedMb: number;
}

export interface Submission {
  id: UUID;
  exerciseId: UUID;
  studentId: UUID;
  courseId: UUID;
  code: string;
  language: string;
  attemptNumber: number;
  status: SubmissionStatus;
  verdict: SubmissionVerdict;
  score: number;
  isLate: boolean;
  createdAt: string;
  testResults?: TestResult[];
}

export interface ExecutionRequest {
  exerciseId: UUID;
  code: string;
  language: string;
}
