import { UUID } from '@CustomTypes/common.types';

export enum ExportFormat {
  ZIP = 'zip',
  TAR = 'tar',
  CSV = 'csv',
  JSON = 'json',
}

export enum ExportPurpose {
  PLAGIARISM_CHECK = 'plagiarism_check',
  BACKUP = 'backup',
  ANALYSIS = 'analysis',
  SHARING = 'sharing',
}

export interface ExportEntity {
  id: UUID;
  submissionId: UUID;
  exportFormat: ExportFormat;
  exportPath: string;
  purpose: ExportPurpose;
  fileSizeBytes?: number | null;
  exportedBy: UUID;
  createdAt: Date;
}

export interface ExportDTO {
  id: UUID;
  submissionId: UUID;
  format: ExportFormat;
  purpose: ExportPurpose;
  sizeBytes?: number | null;
  createdAt: Date;
  downloadUrl?: string;
}
