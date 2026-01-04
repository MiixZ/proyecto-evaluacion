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
