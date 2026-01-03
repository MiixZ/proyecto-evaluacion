export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  syllabusId: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: string;
  templateCode?: string | null;
  points: number;
  maxAttempts: number;
  deadline?: string;
}

export interface SubmissionResponse {
  id: string;
  status: string;
  verdict: string;
  score: number;
  testResults: TestResult[];
}

export interface TestResult {
  id: string;
  status: "passed" | "failed" | "error";
  input?: string;
  expectedOutput?: string;
  actualOutput?: string | null;
  executionTimeMs: number;
  memoryUsedMb: number;
}
