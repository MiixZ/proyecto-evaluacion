import { UUID } from '@CustomTypes/common.types';
import {
  SubmissionStatus,
  SubmissionVerdict,
  Timestamps,
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
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionDTO {
  id: UUID;
  exerciseId: UUID;
  attemptNumber: number;
  status: SubmissionStatus;
  verdict: SubmissionVerdict;
  score: number;
  isLate: boolean;
  createdAt: Date;
}
