export type UUID = string;

export interface RankingStudent {
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

export interface SubjectTeacher {
  teacherId: UUID;
  teacherName: string;
  teacherEmail: string;
  teacherImage: string | null;
  subjectName: string;
  courseCount: number;
}

export interface RankingFilter {
  subjects: Array<{ id: UUID; name: string }>;
  groups: Array<{
    id: UUID;
    name: string;
    courseId: UUID;
    academicYear: string;
  }>;
}

export interface RankingResponse {
  students: RankingStudent[];
  teacher: SubjectTeacher | null;
  filters: RankingFilter;
}

export interface SubjectGroup {
  id: UUID;
  name: string;
  academicYear: string;
}
