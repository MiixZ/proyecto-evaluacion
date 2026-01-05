import { RowDataPacket } from 'mysql2';

export interface SyllabusRow extends RowDataPacket {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: string;
  order_index: number;
  is_public: number;
  created_at: Date;
  updated_at: Date;
  exercises_count?: number;
}
