export interface ExecutionRequest {
  id: string;
  exerciseId: string;
  submissionId: string;
  code: string;
  language: string;
  testCases: TestCase[];
  limits: ExecutionLimits;
  createdAt: Date;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  timeLimit: number;
  memoryLimit: number;
  isHidden: boolean;
}

export interface ExecutionLimits {
  timeLimitSeconds: number;
  memoryLimitMb: number;
  cpuShares?: number;
  maxProcesses?: number;
}

export interface ExecutionResult {
  submissionId: string;
  verdict: Veredict;
  score: number;
  testResults: TestResult[];
  executionTime: number;
  memoryUsed: number;
  compilationError?: string;
  runtimeError?: string;
  containerLogs?: string;
}

export interface TestResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  expectedOutput: string;
  actualOutput: string;
  executionTime: number;
  memoryUsed: number;
  errorMessage?: string;
}

export enum Veredict {
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  SYSTEM_ERROR = 'system_error',
}
