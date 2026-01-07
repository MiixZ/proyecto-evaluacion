import { UUID } from '@CustomTypes/common.types';

export interface RankingStudentDTO {
  studentId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string | null;
  stats: {
    exercisesCompleted: number;
    totalExercises: number;
    avgScore: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    perfectScores: number;
    lastSubmission: string | null;
  };
  rank: number;
}

export interface SubjectTeacherDTO {
  teacherId: UUID;
  teacherName: string;
  teacherEmail: string;
  teacherImage: string | null;
  subjectName: string;
  courseCount: number;
}

export interface RankingFilterDTO {
  subjects: Array<{ id: UUID; name: string }>;
  groups: Array<{
    id: UUID;
    name: string;
    courseId: UUID;
    academicYear: string;
  }>;
}

export interface RankingResponseDTO {
  students: RankingStudentDTO[];
  teacher: SubjectTeacherDTO | null;
  filters: RankingFilterDTO;
}
