export interface StudentDashboardProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  academicYear: string;
  subjectName: string;
  exerciseId: string;
  exerciseTitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  deadline?: string;
  attempts: number;
  isCompleted: boolean;
  bestScore: number;
  lastAttempt?: string;
}

export interface StudentStats {
  completedExercises: number;
  totalSubmissions: number;
  averageGrade: number;
  pendingExercises: number;
}

export interface StudentProgress {
  subject: string;
  progress: number;
  grade: number;
}

export interface ProfessorStats {
  totalStudents: number;
  activeExercises: number;
  passRate: number;
  pendingSubmissions: number;
}

export interface AdminStats {
  totalStudents: number;
  totalProfessors: number;
  totalExercises: number;
  totalSubmissions: number;
}

export interface DashboardSubmission {
  id: string;
  studentId: string;
  exerciseId: string;
  status: "pending" | "passed" | "failed";
  grade: number;
  createdAt: string;
  studentName?: string;
  exerciseTitle?: string;
  groupName?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
