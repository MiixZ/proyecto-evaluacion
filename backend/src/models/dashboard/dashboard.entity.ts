import { UUID } from '@CustomTypes/common.types';

export interface StudentProgressDTO {
  studentId: UUID;
  studentName: string;
  courseId: UUID;
  academicYear: string;
  subjectName: string;
  syllabusTitle: string;
  exerciseId: UUID;
  exerciseTitle: string;
  attempts: number;
  isCompleted: boolean;
  bestScore: number;
  lastAttempt: Date | null;
  difficulty: string;
  deadline: Date | null;
}

export interface GroupStatsDTO {
  groupId: UUID;
  courseId: UUID;
  groupName: string;
  academicYear: string;
  subjectName: string;
  studentCount: number;
  exerciseCount: number;
  avgScore: number;
  completionPercentage: number;
}

export interface TeacherWorkloadDTO {
  teacherId: UUID;
  teacherName: string;
  groupsAssigned: number;
  subjectsCount: number;
  pendingFeedback: number;
  pendingEvaluation: number;
}

export interface ExerciseMetricsDTO {
  exerciseId: UUID;
  title: string;
  difficulty: string;
  totalSubmissions: number;
  studentsAttempted: number;
  acceptanceRate: number;
  avgExecutionTimeMs: number;
  avgMemoryUsedMb: number;
}

export interface PlagiarismSummaryDTO {
  courseId: UUID;
  academicYear: string;
  subjectName: string;
  totalChecks: number;
  flaggedSubmissions: number;
  avgSimilarity: number;
  breakdown: {
    internal: number;
    external: number;
    ai: number;
  };
}

// --- NUEVOS DTOs ---

export interface GroupStudentDTO {
  id: UUID;
  name: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  averageScore: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'risk';
}

export interface RecentActivityDTO {
  id: UUID;
  studentName: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface PlagiarismAlertDTO {
  id: UUID;
  studentName: string;
  exerciseTitle: string;
  similarity: number;
  type: string;
  date: string;
  reviewedAt: string | null;
  isReviewed: boolean;
}

export interface TeacherDashboardDTO {
  groups: GroupStatsDTO[];
  activeGroup: {
    info: GroupStatsDTO;
    students: GroupStudentDTO[];
    recentActivity: RecentActivityDTO[];
    plagiarismAlerts: PlagiarismAlertDTO[];
  } | null;
}
