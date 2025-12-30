import { UUID, Timestamps, PlagiarismType } from '@CustomTypes/common.types';

export interface PlagiarismEntity extends Timestamps {
  id: UUID;
  submissionId: UUID;
  comparedWithSubmissionId: UUID;
  similarityPercent: number;
  plagiarismType: PlagiarismType;
  toolUsed?: string | null;
  toolReportUrl?: string | null;
  isFlagged: boolean;
  reviewedAt?: Date | null;
  reviewedBy?: UUID | null;
  notes?: string | null;
}

export interface PlagiarismDTO {
  id: UUID;
  submissionId: UUID;
  comparedWithSubmissionId: UUID;
  similarityPercent: number;
  plagiarismType: PlagiarismType;
  isFlagged: boolean;
  reviewedAt?: Date | null;
  reviewedBy?: UUID | null;
  notes?: string | null;
  createdAt: Date;
}
