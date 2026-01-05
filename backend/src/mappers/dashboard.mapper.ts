import {
  StudentProgressRow,
  GroupStatsRow,
  TeacherWorkloadRow,
  ExerciseMetricsRow,
  PlagiarismSummaryRow,
  GroupStudentRow,
  RecentActivityRow,
  PlagiarismAlertRow,
} from '@models/dashboard/dashboard.row';
import {
  StudentProgressDTO,
  GroupStatsDTO,
  TeacherWorkloadDTO,
  ExerciseMetricsDTO,
  PlagiarismSummaryDTO,
  GroupStudentDTO,
  RecentActivityDTO,
  PlagiarismAlertDTO,
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
      syllabusTitle: row.syllabus_title,
      syllabusDescription: row.syllabus_description || undefined,
      exerciseId: row.exercise_id as UUID,
      exerciseTitle: row.exercise_title,
      attempts: row.attempts,
      isCompleted: Boolean(row.is_completed),
      bestScore: row.best_score,
      lastAttempt: row.last_attempt ? new Date(row.last_attempt) : null,
      difficulty: row.difficulty,
      deadline: row.deadline ? new Date(row.deadline) : null,
    };
  },

  toGroupStatsDTO(row: GroupStatsRow): GroupStatsDTO {
    return {
      groupId: row.group_id as UUID,
      courseId: row.course_id as UUID,
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

  toGroupStudentDTO(row: GroupStudentRow): GroupStudentDTO {
    let status: 'active' | 'inactive' | 'risk' = 'active';

    if (row.status === 'inactive' || row.status === 'suspended') {
      status = 'inactive';
    } else if (row.avg_score < 5 && row.exercises_completed > 0) {
      status = 'risk';
    }

    return {
      id: row.student_id as UUID,
      name: `${row.first_name} ${row.last_name}`,
      email: row.email,
      avatarUrl: row.profile_image_url,
      progress: Math.min(100, (row.exercises_completed / 10) * 100),
      averageScore: Number(row.avg_score),
      lastActive: row.last_access
        ? new Date(row.last_access).toISOString()
        : new Date().toISOString(),
      status,
    };
  },

  toRecentActivityDTO(row: RecentActivityRow): RecentActivityDTO {
    let status: 'success' | 'warning' | 'error' | 'info' = 'info';
    if (row.verdict === 'accepted') status = 'success';
    else if (row.verdict === 'wrong_answer') status = 'warning';
    else if (['compilation_error', 'runtime_error'].includes(row.verdict))
      status = 'error';

    return {
      id: row.submission_id as UUID,
      studentName: row.student_name,
      action: `Entregó ${row.exercise_title}`,
      time: new Date(row.created_at).toISOString(),
      status,
    };
  },

  toPlagiarismAlertDTO(row: PlagiarismAlertRow): PlagiarismAlertDTO {
    return {
      id: row.check_id as UUID,
      studentName: row.student_name,
      exerciseTitle: row.exercise_title,
      similarity: Number(row.similarity_percent),
      type: row.plagiarism_type,
      date: new Date(row.created_at).toISOString(),
      reviewedAt: row.reviewed_at
        ? new Date(row.reviewed_at).toISOString()
        : null,
      isReviewed: !!row.reviewed_at,
    };
  },
};
