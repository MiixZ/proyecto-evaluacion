import { UUID, Timestamps } from '@CustomTypes/common.types';

export enum FeedbackVisibility {
  PRIVATE = 'private',
  STUDENT = 'student',
  GROUP = 'group',
  PUBLIC = 'public',
}

export interface FeedbackEntity extends Timestamps {
  id: UUID;
  submissionId: UUID;
  teacherId: UUID;
  content: string;
  isGeneral: boolean;
  lineNumber?: number | null;
  scoreAdjustment: number;
  visibility: FeedbackVisibility;
}

export interface FeedbackDTO {
  id: UUID;
  submissionId: UUID;
  teacherId: UUID;
  content: string;
  isGeneral: boolean;
  lineNumber?: number | null;
  scoreAdjustment: number;
  visibility: FeedbackVisibility;
  createdAt: Date;
}
