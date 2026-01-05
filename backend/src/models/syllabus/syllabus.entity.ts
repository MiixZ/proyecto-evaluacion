import { UUID, Timestamps } from '@CustomTypes/common.types';

export interface SyllabusEntity extends Timestamps {
  id: UUID;
  courseId: UUID;
  title: string;
  description: string | null;
  contentType: 'module' | 'topic' | 'lesson';
  orderIndex: number;
  isPublic: boolean;
}

export interface SyllabusDTO {
  id: UUID;
  courseId: UUID;
  title: string;
  description: string | null;
  contentType: 'module' | 'topic' | 'lesson';
  orderIndex: number;
  isPublic: boolean;
}
