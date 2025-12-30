import {
  UUID,
  SubmissionStatus,
  SubmissionVerdict,
  Timestamps,
  EfficiencyOrder,
  TestCaseStatus,
} from '@CustomTypes/common.types';

// --- ENTIDADES DE DOMINIO ---

export interface SubmissionEntity extends Timestamps {
  id: UUID;
  exerciseId: UUID;
  studentId: UUID;
  courseId: UUID;
  attemptNumber: number;
  code: string;
  language: string;
  status: SubmissionStatus;
  verdict: SubmissionVerdict;
  score: number;
  isLate: boolean;
  usedHint: boolean;
  testResults?: SubmissionTestResultEntity[];
}

export interface SubmissionTestResultEntity {
  id: UUID;
  submissionId: UUID;
  testCaseId: UUID;
  status: TestCaseStatus | string;
  actualOutput?: string | null;
  errorId?: UUID | null; // NUEVO
  executionTimeMs: number;
  memoryUsedMb: number;
  efficiencyAchieved: EfficiencyOrder;
  createdAt?: Date;
}

// --- DATA TRANSFER OBJECTS (DTOs) ---

export interface SubmissionTestResultDTO {
  id: UUID;
  status: string;
  executionTimeMs: number;
  memoryUsedMb: number;
  actualOutput?: string | null;
  error?: string | null;
}

export interface SubmissionDTO {
  id: UUID;
  exerciseId: UUID;
  studentId: UUID;
  courseId: UUID;
  attemptNumber: number;
  language: string;
  code: string;
  status: SubmissionStatus;
  verdict: SubmissionVerdict;
  score: number;
  isLate: boolean;
  usedHint: boolean;
  createdAt: Date;
  updatedAt: Date;
  testResults?: SubmissionTestResultDTO[];
}

export interface SubmissionSimpleDTO {
  id: UUID;
  verdict: SubmissionVerdict;
  score: number;
  status: SubmissionStatus;
  createdAt: Date;
}
