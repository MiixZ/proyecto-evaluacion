import {
  StudentProgressRow,
  GroupStatsRow,
  TeacherWorkloadRow,
  ExerciseMetricsRow,
  PlagiarismSummaryRow,
} from '@models/dashboard/dashboard.row';
import {
  StudentProgressDTO,
  GroupStatsDTO,
  TeacherWorkloadDTO,
  ExerciseMetricsDTO,
  PlagiarismSummaryDTO,
} from '@models/dashboard/dashboard.entity';
import { UUID } from '@CustomTypes/common.types';

export const dashboardMapper = {
  toStudentProgressDTO(row: StudentProgressRow): StudentProgressDTO {
    return {
      studentId: row.student_id as UUID,
      studentName: `${row.first_name} ${row.last_name}`,
      courseId: row.course_id as UUID,
      academicYear: row.academic_year,
      subjectName: row.subject_name,
      exerciseId: row.exercise_id as UUID,
      exerciseTitle: row.exercise_title,
      attempts: row.attempts,
      isCompleted: Boolean(row.is_completed),
      bestScore: row.best_score,
      lastAttempt: new Date(row.last_attempt),
    };
  },

  toGroupStatsDTO(row: GroupStatsRow): GroupStatsDTO {
    return {
      groupId: row.group_id as UUID,
      groupName: row.group_name,
      academicYear: row.academic_year,
      subjectName: row.subject_name,
      studentCount: row.student_count,
      exerciseCount: row.exercise_count,
      avgScore: Number(row.avg_score),
      completionPercentage: Number(row.completion_percentage),
    };
  },

  toTeacherWorkloadDTO(row: TeacherWorkloadRow): TeacherWorkloadDTO {
    return {
      teacherId: row.teacher_id as UUID,
      teacherName: `${row.first_name} ${row.last_name}`,
      groupsAssigned: row.groups_assigned,
      subjectsCount: row.subjects,
      pendingFeedback: row.pending_feedback,
      pendingEvaluation: row.pending_evaluation,
    };
  },

  toExerciseMetricsDTO(row: ExerciseMetricsRow): ExerciseMetricsDTO {
    return {
      exerciseId: row.exercise_id as UUID,
      title: row.title,
      difficulty: row.difficulty,
      totalSubmissions: row.total_submissions,
      studentsAttempted: row.students_attempted,
      acceptanceRate: Number(row.acceptance_rate),
      avgExecutionTimeMs: Number(row.avg_execution_time_ms),
      avgMemoryUsedMb: Number(row.avg_memory_used_mb),
    };
  },

  toPlagiarismSummaryDTO(row: PlagiarismSummaryRow): PlagiarismSummaryDTO {
    return {
      courseId: row.course_id as UUID,
      academicYear: row.academic_year,
      subjectName: row.subject_name,
      totalChecks: row.total_checks,
      flaggedSubmissions: row.flagged_submissions,
      avgSimilarity: Number(row.avg_similarity),
      breakdown: {
        internal: row.internal_plagiarism,
        external: row.external_plagiarism,
        ai: row.ai_generated,
      },
    };
  },
};
