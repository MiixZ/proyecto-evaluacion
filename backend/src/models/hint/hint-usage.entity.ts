import { UUID } from '@CustomTypes/common.types';

export interface HintUsageEntity {
  id: UUID;
  submissionId: UUID;
  testCaseId: UUID;
  hintText: string;
  penaltyApplied: number;
  usedAt: Date;
}

export interface HintUsageDTO {
  id: UUID;
  submissionId: UUID;
  testCaseId: UUID;
  hintText: string;
  penaltyApplied: number;
  usedAt: Date;
}
