export enum FeedbackVisibility {
  PRIVATE = "private",
  STUDENT = "student",
  GROUP = "group",
  PUBLIC = "public",
}

export interface FeedbackDTO {
  id: string;
  submissionId: string;
  teacherId: string;
  content: string;
  isGeneral: boolean;
  lineNumber?: number | null;
  scoreAdjustment: number;
  visibility: FeedbackVisibility;
  createdAt: string;
}

export interface CreateFeedbackInput {
  submissionId: string;
  content: string;
  isGeneral: boolean;
  lineNumber?: number | null;
  scoreAdjustment: number;
  visibility: FeedbackVisibility;
}
