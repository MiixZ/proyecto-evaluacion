import { UUID } from '@CustomTypes/common.types';

export interface SubmissionErrorEntity {
  id: UUID;
  errorType: string;
  errorMessage: string;
  errorDetails?: Record<string, any> | null;
  isActive: boolean;
  createdAt: Date;
}

export interface SubmissionErrorDTO {
  code: string;
  name: string;
  details?: Record<string, any> | null;
}
