import { RowDataPacket } from 'mysql2';

export interface CourseRow extends RowDataPacket {
  id: string;
  subject_id: string;
  academic_year: string;
  semester: number;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  migrated_from: string | null;
  created_at: Date;
  updated_at: Date;
}
