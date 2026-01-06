import { RowDataPacket } from 'mysql2';
import { UUID } from '@CustomTypes/common.types';

export interface RankingStudentRow extends RowDataPacket {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string | null;
  exercises_completed: number;
  total_exercises: number;
  avg_score: number;
  total_submissions: number;
  accepted_submissions: number;
  perfect_scores: number;
  last_submission: Date | null;
}

export interface SubjectTeacherRow extends RowDataPacket {
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  teacher_image: string | null;
  subject_name: string;
  course_count: number;
}

export interface RankingFilterInfo extends RowDataPacket {
  subject_id: string;
  subject_name: string;
  group_id: string;
  group_name: string;
  course_id: string;
  academic_year: string;
}
