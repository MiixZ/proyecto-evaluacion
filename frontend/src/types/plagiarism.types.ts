import { UUID } from "crypto";

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

export enum PlagiarismType {
  INTERNAL = "internal",
  EXTERNAL = "external",
  AI_GENERATED = "ai_generated",
}
