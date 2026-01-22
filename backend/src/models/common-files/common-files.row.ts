import { RowDataPacket } from 'mysql2';

export interface ExerciseCommonFileRow extends RowDataPacket {
  id: string;
  exercise_id: string;
  filename: string;
  content: string;
  file_type: 'source' | 'data' | 'config' | 'header';
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SyllabusCommonFileRow extends RowDataPacket {
  id: string;
  syllabus_id: string;
  filename: string;
  content: string;
  file_type: 'source' | 'data' | 'config' | 'header';
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
