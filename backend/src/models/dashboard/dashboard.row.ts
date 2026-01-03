import { RowDataPacket } from 'mysql2';

export interface StudentProgressRow extends RowDataPacket {
  student_id: string;
  first_name: string;
  last_name: string;
  course_id: string;
  academic_year: string;
  exercise_id: string;
  exercise_title: string;
  difficulty: string;
  deadline: Date | null;
  subject_name: string;
  attempts: number;
  is_completed: number;
  best_score: number | null;
  last_attempt: Date | null;
}

export interface GroupStatsRow extends RowDataPacket {
  group_id: string;
  group_name: string;
  academic_year: string;
  subject_name: string;
  student_count: number;
  exercise_count: number;
  avg_score: number;
  completion_percentage: number;
}

export interface TeacherWorkloadRow extends RowDataPacket {
  teacher_id: string;
  first_name: string;
  last_name: string;
  groups_assigned: number;
  subjects: number;
  pending_feedback: number;
  pending_evaluation: number;
}

export interface ExerciseMetricsRow extends RowDataPacket {
  exercise_id: string;
  title: string;
  difficulty: string;
  total_submissions: number;
  students_attempted: number;
  acceptance_rate: number;
  avg_execution_time_ms: number;
  avg_memory_used_mb: number;
}

export interface PlagiarismSummaryRow extends RowDataPacket {
  course_id: string;
  academic_year: string;
  subject_name: string;
  total_checks: number;
  flagged_submissions: number;
  avg_similarity: number;
  internal_plagiarism: number;
  external_plagiarism: number;
  ai_generated: number;
}
