import { UUID, Timestamps } from '@CustomTypes/common.types';

export interface DegreeEntity extends Timestamps {
  id: UUID;
  name: string;
  code: string;
  description?: string | null;
  durationYears: number;
  totalCredits: number;
  status: 'active' | 'archived';
}

export interface DegreeDTO {
  id: UUID;
  name: string;
  code: string;
  description?: string | null;
  durationYears: number;
  totalCredits: number;
  status: string;
}
