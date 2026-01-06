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
  archived: boolean;
  deletedAt?: Date | null;
  archivedBy?: UUID | null;
  archivedReason?: 'teacher_deleted' | 'student_removed' | 'manual' | null;
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
  hintText?: string | null;
  input?: string;
  expectedOutput?: string;
}
}

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
  hintText?: string | null;
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
  archived: boolean;
  deletedAt?: string | null;
  archivedBy?: string | null;
  archivedReason?: string | null;
  createdAt: string;
  testResults: SubmissionTestResultDTO[];
}
