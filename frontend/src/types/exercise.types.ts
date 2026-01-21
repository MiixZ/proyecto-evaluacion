export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  syllabusId: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: string;
  templateCode?: string;
  points: number;
  maxAttempts: number;
  deadline?: string;
  lateDeadline?: string;
  lateSubmissionPenaltyPercent: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  testCases?: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    runnerCode?: string;
    isHidden: boolean;
    timeLimitSeconds: number;
    memoryLimitMb: number;
    hintText: string;
    hintPenaltyPercent: number;
    availableFrom?: string;
  }>;
  limits?: {
    timeLimitSeconds: number;
    memoryLimitMb: number;
  };
  courseId?: string;
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
  createdAt: string | number | Date;
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
  testResults?: TestResult[];
}

export interface HintResponse {
  hintText: string;
  penaltyApplied: number;
}
