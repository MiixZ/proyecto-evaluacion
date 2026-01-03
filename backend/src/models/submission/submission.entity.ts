import {
  UUID,
  SubmissionVerdict,
  EfficiencyOrder,
} from '../../types/common.types';
import { RowDataPacket } from 'mysql2';

export interface SubmissionEntity extends RowDataPacket {
  id: UUID;
  exerciseId: UUID;
  studentId: UUID;
  courseId: UUID;
  attemptNumber: number;
  code: string;
  language: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  verdict: SubmissionVerdict;
  score: number;
  isLate: boolean;
  usedHint: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionTestResultEntity {
  id: UUID;
  submissionId: UUID;
  testCaseId: UUID;
  status: string;
  actualOutput?: string | null;
  errorId?: UUID | null;
  executionTimeMs: number;
  memoryUsedMb: number;
  efficiencyAchieved: EfficiencyOrder;
}

// DTOs para respuesta API
export interface SubmissionTestResultDTO {
  id: string;
  testCaseId: string;
  status: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string | null;
  executionTimeMs: number;
  memoryUsedMb: number;
  error?: string | null;
}

export interface SubmissionDTO {
  id: string;
  exerciseId: string;
  studentId: string;
  courseId: string;
  attemptNumber: number;
  code: string;
  language: string;
  status: string;
  verdict: string;
  score: number;
  isLate: boolean;
  createdAt: string;
  testResults: SubmissionTestResultDTO[];
}
