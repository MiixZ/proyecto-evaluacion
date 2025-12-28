import { UUID } from '@CustomTypes/common.types';

export interface TestCaseEntity {
  id: UUID;
  exerciseId: UUID;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  timeLimitSeconds: number;
  memoryLimitMb: number;
}

export interface ExecutionLimitEntity {
  id: UUID;
  exerciseId: UUID;
  language: string;
  timeLimitSeconds: number;
  memoryLimitMb: number;
}
