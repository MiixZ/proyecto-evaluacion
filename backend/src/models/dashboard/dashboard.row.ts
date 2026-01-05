import { RowDataPacket } from 'mysql2';

export interface StudentProgressRow extends RowDataPacket {
  student_id: string;
  first_name: string;
  last_name: string;
  course_id: string;
  academic_year: string;
  exercise_id: string;
  exercise_title: string;
  subject_name: string;
  syllabus_title: string;
  syllabus_description: string | null;
  attempts: number;
  is_completed: number;
  best_score: number;
  last_attempt: Date | null;
  difficulty: string;
  deadline: Date | null;
}

export interface GroupStatsRow extends RowDataPacket {
  group_id: string;
  course_id: string;
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

export interface GroupStudentRow extends RowDataPacket {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string | null;
  exercises_completed: number;
  avg_score: number;
  last_access: Date;
  status: string;
}

export interface RecentActivityRow extends RowDataPacket {
  submission_id: string;
  student_name: string;
  exercise_title: string;
  status: string;
  verdict: string;
  created_at: Date;
}

export interface PlagiarismAlertRow extends RowDataPacket {
  check_id: string;
  student_name: string;
  exercise_title: string;
  similarity_percent: number;
  plagiarism_type: string;
  created_at: Date;
  reviewed_at: Date | null;
}

export interface AdminStatsRow {
  activeDegrees: number;
  activeSubjects: number;
  activeTeachers: number;
  totalExercises: number;
}

export interface AcademicStructureRow {
  degree_id: string;
  degree_name: string;
  subject_id: string;
  subject_name: string;
  group_count: number;
  student_count: number;
  exercise_count: number;
}

export interface TeacherStatsRow {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject_count: number;
  group_count: number;
}

export interface GlobalStatsRow {
  activeStudents: number;
  submissionsToday: number;
  successRate: number;
}
