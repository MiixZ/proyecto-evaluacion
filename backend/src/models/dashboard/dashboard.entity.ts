import { UUID } from '@CustomTypes/common.types';

export interface StudentProgressDTO {
  studentId: UUID;
  studentName: string;
  courseId: UUID;
  academicYear: string;
  subjectName: string;
  exerciseId: UUID;
  exerciseTitle: string;
  attempts: number;
  isCompleted: boolean;
  bestScore: number;
  lastAttempt: Date;
}

export interface GroupStatsDTO {
  groupId: UUID;
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
