import {
  UUID,
  SubmissionStatus,
  SubmissionVerdict,
  Timestamps,
  EfficiencyOrder,
} from '@CustomTypes/common.types';

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
}

export interface SubmissionTestResultEntity {
  id: UUID;
  submissionId: UUID;
  testCaseId: UUID;
  status: 'passed' | 'failed' | 'error';
  actualOutput?: string | null;
  executionTimeMs: number;
  memoryUsedMb: number;
  efficiencyAchieved: EfficiencyOrder;
}

export interface SubmissionDetailDTO {
  id: UUID;
  status: SubmissionStatus;
  verdict: SubmissionVerdict;
  score: number;
  testResults: {
    status: string;
    executionTimeMs: number;
    isHidden: boolean;
    actualOutput?: string | null;
  }[];
  createdAt: Date;
}
