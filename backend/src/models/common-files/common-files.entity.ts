import { UUID } from '@CustomTypes/common.types';

export interface ExerciseCommonFileEntity {
  id: UUID;
  exerciseId: UUID;
  filename: string;
  content: string;
  fileType: 'source' | 'data' | 'config' | 'header';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyllabusCommonFileEntity {
  id: UUID;
  syllabusId: UUID;
  filename: string;
  content: string;
  fileType: 'source' | 'data' | 'config' | 'header';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommonFileInput {
  filename: string;
  content: string;
  fileType?: 'source' | 'data' | 'config' | 'header';
  description?: string;
}

export interface UpdateCommonFileInput {
  filename?: string;
  content?: string;
  fileType?: 'source' | 'data' | 'config' | 'header';
  description?: string;
}
