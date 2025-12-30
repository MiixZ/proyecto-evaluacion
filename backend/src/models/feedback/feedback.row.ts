import { RowDataPacket } from 'mysql2';

export interface FeedbackRow extends RowDataPacket {
  id: string;
  submission_id: string;
  teacher_id: string;
  content: string;
  is_general: number;
  line_number: number | null;
  score_adjustment: number;
  visibility: string;
  created_at: Date;
  updated_at: Date;
}
