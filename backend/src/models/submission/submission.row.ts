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
  error_id?: string | null;
  execution_time_ms: number | null;
  memory_used_mb: number | null;
  efficiency_achieved: string;
  created_at: Date;
}

export interface SubmissionJoinRow extends RowDataPacket {
  // Campos de Submission
  s_id: string;
  s_exercise_id: string;
  s_student_id: string;
  s_course_id: string;
  s_attempt_number: number;
  s_code: string;
  s_language: string;
  s_status: string;
  s_verdict: string;
  s_score: number;
  s_is_late: number;
  s_created_at: Date;

  // Campos de TestResults
  tr_id: string | null;
  tr_test_case_id: string | null;
  tr_status: string | null;
  tr_actual_output: string | null;
  tr_execution_time_ms: number | null;
  tr_memory_used_mb: number | null;
}
