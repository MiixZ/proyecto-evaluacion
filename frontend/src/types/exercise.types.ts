export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  syllabusId: string;
  courseId?: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: string;
  templateCode?: string | null;
  points: number;
  maxAttempts: number;
  deadline?: string;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  status: "passed" | "failed" | "error";
  input?: string;
  expectedOutput?: string;
  actualOutput?: string | null;
  executionTimeMs: number;
  memoryUsedMb: number;
  hintText?: string | null;
}

export interface StudentSubmission {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  subjectName: string;
  courseId: string;
  verdict: string;
  score: number;
  createdAt: string;
  language: string;
}

export interface SubmissionResponse {
  id: string;
  status: string;
  verdict: string;
  score: number;
  testResults: TestResult[];
}

export interface SubmissionHistoryItem {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  verdict: string;
  score: number;
  createdAt: string;
  language: string;
  executionTimeMs?: number;
  code: string;
}

export interface HintResponse {
  hintText: string;
  penaltyApplied: number;
}
