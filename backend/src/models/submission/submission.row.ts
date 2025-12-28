import { RowDataPacket } from 'mysql2';

export interface SubmissionRow extends RowDataPacket {
  id: string;
  exercise_id: string;
  student_id: string;
  course_id: string;
  attempt_number: number;
  code: string;
  language: string;
  status: string;
  verdict: string;
  score: number;
  is_late: number;
  used_hint: number;
  created_at: Date;
  updated_at: Date;
}

export interface SubmissionTestResultRow extends RowDataPacket {
  id: string;
  submission_id: string;
  test_case_id: string;
  status: string;
  actual_output: string | null;
  execution_time_ms: number | null;
  memory_used_mb: number | null;
  efficiency_achieved: string;
  created_at: Date;
}
