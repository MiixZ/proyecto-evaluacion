import { UUID, Timestamps } from '@CustomTypes/common.types';

export interface SubjectEntity extends Timestamps {
  id: UUID;
  degreeId: UUID;
  name: string;
  code: string;
  description?: string | null;
  docentGuideUrl?: string | null;
  semester?: number | null;
  credits?: number | null;
  status: 'active' | 'archived';
}

export interface SubjectDTO {
  id: UUID;
  degreeId: UUID;
  name: string;
  code: string;
  description?: string | null;
  semester?: number | null;
  credits?: number | null;
  status: string;
}
