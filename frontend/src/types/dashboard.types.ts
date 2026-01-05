import { UUID } from "crypto";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface GroupStatsDTO {
  courseId: string;
  groupId: string;
  groupName: string;
  academicYear: string;
  subjectName: string;
  studentCount: number;
  exerciseCount: number;
  avgScore: number;
  completionPercentage: number;
}

export interface GroupStudentDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  averageScore: number;
  lastActive: string;
  status: "active" | "inactive" | "risk";
}

export interface StudentDashboardProgress {
  bestScore: number;
  lastAttempt: any;
  difficulty: string;
  exerciseId: UUID;
  courseId: string;
  deadline: any;
  isCompleted: any;
  attempts: number;
  subjectName: any;
  syllabusTitle: string;
  exerciseTitle: any;
  stats: StudentStats;
  progressBySubject: StudentProgress[];
  recentSubmissions: DashboardSubmission[];
}

export interface RecentActivityDTO {
  exerciseTitle: string;
  id: string;
  studentName: string;
  action: string;
  time: string;
  status: "success" | "warning" | "error" | "info";
}

export interface PlagiarismAlertDTO {
  id: string;
  studentName: string;
  exerciseTitle: string;
  similarity: number;
  type: string;
  date: string;
  reviewedAt?: string | null;
  isReviewed?: boolean;
}

export interface ProfessorDashboardResponse {
  groups: GroupStatsDTO[];
  activeGroup: {
    info: GroupStatsDTO;
    students: GroupStudentDTO[];
    recentActivity: RecentActivityDTO[];
    plagiarismAlerts: PlagiarismAlertDTO[];
  } | null;
}

// --- TIPOS DE ADMIN ---

export interface AdminStatsKPI {
  activeDegrees: number;
  activeSubjects: number;
  activeTeachers: number;
  totalExercises: number;
}

export interface AdminSubjectDTO {
  id: string;
  name: string;
  stats: {
    groups: number;
    students: number;
    exercises: number;
  };
}

export interface AdminDegreeDTO {
  id: string;
  name: string;
  subjects: AdminSubjectDTO[];
}

export interface AdminTeacherDTO {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject_count: number;
  group_count: number;
}

export interface AdminGlobalStats {
  activeStudents: number;
  submissionsToday: number;
  successRate: number;
}

export interface AdminDashboardResponse {
  kpis: AdminStatsKPI;
  academicStructure: AdminDegreeDTO[];
  teachers: AdminTeacherDTO[];
  globalStats: AdminGlobalStats;
}

// ---------------------

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

export interface DashboardSubmission {
  id: string;
  studentId: string;
  exerciseId: string;
  status: "pending" | "running" | "completed" | "failed";
  verdict?: string;
  grade?: number;
  score?: number;
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
