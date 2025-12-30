import { RowDataPacket } from 'mysql2';

export interface ExerciseRow extends RowDataPacket {
  id: string;
  syllabus_id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  template_code: string | null;
  is_published: number;
  created_by: string;
  order_index: number | null;
  points: number;
  efficiency_order: string;
  deadline: Date | null;
  late_submission_penalty_percent: number;
  max_attempts: number;
  created_at: Date;
  updated_at: Date;
}

export interface TestCaseRow extends RowDataPacket {
  id: string;
  exercise_id: string;
  input: string;
  expected_output: string;
  is_hidden: number;
  order_index: number | null;
  time_limit_seconds: number;
  memory_limit_mb: number;
  efficiency_order: string;
  hint_text: string | null;
  hint_penalty_percent: number;
  created_at: Date;
  updated_at: Date;
}

export interface ExecutionLimitRow extends RowDataPacket {
  id: string;
  exercise_id: string;
  language: string;
  time_limit_seconds: number;
  memory_limit_mb: number;
  created_at: Date;
  updated_at: Date;
}
