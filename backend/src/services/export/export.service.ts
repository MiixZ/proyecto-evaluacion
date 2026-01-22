import { exportModel } from '@models/export/export.model';
import { CreateExportInput } from '@validators/export.validator';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { dashboardModel } from '@models/dashboard/dashboard.model';
import { ForbiddenError, NotFoundError } from '@utils/errors';
import { ExportFormat } from '@models/export/export.entity';
import { escapeCsvField } from '@utils/csv.parser';

export class ExportService {
  async generateExport(
    input: CreateExportInput,
    userId: UUID,
    userRole: UserRole
  ) {
    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenError('No autorizado para exportar datos');
    }

    const submission = await submissionModel.getById(
      input.submissionId as UUID
    );
    const { content, mimeType, extension } = this.buildExportContent(
      submission,
      input.format
    );
    const fileSizeBytes = Buffer.byteLength(content, 'utf8');
    const virtualPath = `virtual://${input.format}/${submission?.id}.${extension}`;

    const exportEntity = await exportModel.create(
      input,
      virtualPath,
      fileSizeBytes,
      userId
    );

    return {
      entity: exportEntity,
      content,
      mimeType,
      filename: `export_sub_${submission?.attemptNumber}_${submission?.studentId}.${extension}`,
    };
  }

  async getExportById(exportId: string, userRole: UserRole) {
    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenError('No autorizado');
    }

    const exportEntity = await exportModel.getById(exportId as UUID);

    if (!exportEntity) {
      throw new NotFoundError('Exportación no encontrada');
    }

    return exportEntity;
  }

  async regenerateExport(exportId: string, userRole: UserRole) {
    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenError(
        'No autorizado para acceder al historial de exportaciones'
      );
    }

    const exportEntity = await exportModel.getById(exportId as UUID);
    const submission = await submissionModel.getById(exportEntity.submissionId);
    const { content, mimeType, extension } = this.buildExportContent(
      submission,
      exportEntity.exportFormat
    );

    return {
      entity: exportEntity,
      content,
      mimeType,
      filename: `export_sub_${submission?.attemptNumber}_${submission?.studentId}.${extension}`,
    };
  }

  async listExports(
    page: number,
    limit: number,
    filters: { purpose?: string; format?: string },
    userRole: UserRole
  ) {
    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenError('No autorizado');
    }

    return await exportModel.list(page, limit, filters);
  }

  private buildExportContent(submission: any, format: ExportFormat) {
    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === ExportFormat.JSON) {
      content = JSON.stringify(
        {
          meta: {
            generatedAt: new Date(),
            studentId: submission.studentId,
            exerciseId: submission.exerciseId,
          },
          submission: {
            id: submission.id,
            code: submission.code,
            language: submission.language,
            verdict: submission.verdict,
            score: submission.score,
            createdAt: submission.createdAt,
          },
        },
        null,
        2
      );
      mimeType = 'application/json';
      extension = 'json';
    } else if (format === ExportFormat.CSV) {
      const headers = 'SubmissionID,Student,Language,Verdict,Score,Date,Code\n';

      const fields = [
        submission.id,
        submission.studentId,
        submission.language,
        submission.verdict,
        submission.score,
        submission.createdAt,
        submission.code || '',
      ];

      const row = fields.map(escapeCsvField).join(',');
      content = '\uFEFF' + headers + row;
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = submission.code;
      mimeType = 'text/plain';
      const extMap: Record<string, string> = {
        python: 'py',
        javascript: 'js',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        go: 'go',
        rust: 'rs',
      };
      extension = extMap[submission.language] || 'txt';
    }

    return { content, mimeType, extension };
  }

  /**
   * Exporta estadísticas completas de un grupo
   * Incluye: estudiantes, progreso, actividad reciente, alertas de plagio
   * @param groupId - ID del grupo
   * @param format - Formato de exportación (JSON o CSV)
   * @param userId - ID del usuario que exporta
   * @param userRole - Rol del usuario
   */
  async exportGroupStatistics(
    groupId: UUID,
    format: ExportFormat,
    userId: UUID,
    userRole: UserRole
  ) {
    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenError(
        'No autorizado para exportar estadísticas del grupo'
      );
    }

    const groupDetails = await dashboardModel.getGroupDetails(groupId);
    if (!groupDetails) {
      throw new NotFoundError('Grupo no encontrado');
    }

    const students = await dashboardModel.getStudentsByGroup(groupId);
    const recentActivity =
      await dashboardModel.getRecentActivityByGroup(groupId);
    const plagiarismAlerts =
      await dashboardModel.getPlagiarismAlertsByGroup(groupId);
    const groupActivityData = await dashboardModel.getGroupActivity(
      groupId,
      1,
      7,
      'date',
      'DESC'
    );
    const groupActivity = groupActivityData.items;

    let content = '';
    let mimeType = 'application/json';
    let extension = 'json';

    if (format === ExportFormat.JSON) {
      content = JSON.stringify(
        {
          meta: {
            generatedAt: new Date().toISOString(),
            generatedBy: userId,
            groupId,
            groupName: groupDetails.group_name,
          },
          groupDetails: {
            groupName: groupDetails.group_name,
            courseName: groupDetails.course_name,
            subjectName: groupDetails.subject_name,
            academicYear: groupDetails.academic_year,
            totalStudents: groupDetails.total_students,
            activeStudents: groupDetails.active_students,
            totalExercises: groupDetails.total_exercises,
            completedExercises: groupDetails.completed_exercises,
            averageProgress: groupDetails.average_progress,
            averageScore: groupDetails.average_score,
          },
          students: students.map((s) => ({
            studentId: s.student_id,
            firstName: s.first_name,
            lastName: s.last_name,
            email: s.email,
            status: s.status,
            completedExercises: s.exercises_completed ?? 0,
            totalExercises: groupDetails.total_exercises ?? 0,
            progressPercentage:
              groupDetails.total_exercises > 0
                ? Math.round(
                    (s.exercises_completed / groupDetails.total_exercises) * 100
                  )
                : 0,
            averageScore: s.avg_score ?? 0,
            totalSubmissions: '-',
            lastActivity: s.last_access || null,
          })),
          recentActivity: recentActivity.items.map((a) => ({
            studentId: a.student_id,
            studentName: a.student_name,
            exerciseTitle: a.exercise_title,
            verdict: a.verdict,
            score: a.score,
            language: a.language,
            submittedAt: a.submitted_at,
          })),
          plagiarismAlerts: plagiarismAlerts.items.map((p) => ({
            submissionId: p.submission_id,
            studentName: p.student_name,
            exerciseTitle: p.exercise_title,
            similarityPercent: p.similarity_percent,
            plagiarismType: p.plagiarism_type,
            isFlagged: p.is_flagged,
            detectedAt: p.detected_at,
          })),
          dailyActivity: groupActivity.map(
            (ga: {
              date: any;
              total_submissions: any;
              unique_students: any;
              accepted_submissions: any;
              success_rate: any;
            }) => ({
              date: ga.date,
              totalSubmissions: ga.total_submissions,
              uniqueStudents: ga.unique_students,
              acceptedSubmissions: ga.accepted_submissions,
              successRate: ga.success_rate,
            })
          ),
        },
        null,
        2
      );
      mimeType = 'application/json';
      extension = 'json';
    } else if (format === ExportFormat.CSV) {
      const headers =
        [
          'StudentID',
          'FirstName',
          'LastName',
          'Email',
          'Status',
          'CompletedExercises',
          'TotalExercises',
          'ProgressPercentage',
          'AverageScore',
          'TotalSubmissions',
          'LastActivity',
        ].join(',') + '\n';

      const rows = students
        .map((s) => {
          const progressPercent =
            groupDetails.total_exercises > 0
              ? Math.round(
                  (s.exercises_completed / groupDetails.total_exercises) * 100
                )
              : 0;
          const fields = [
            s.student_id,
            s.first_name,
            s.last_name,
            s.email,
            s.status,
            s.exercises_completed ?? 0,
            groupDetails.total_exercises ?? 0,
            progressPercent,
            s.avg_score ?? 0,
            '-', // totalSubmissions not available per-student
            s.last_access || '',
          ];
          return fields.map(escapeCsvField).join(',');
        })
        .join('\n');

      content = '\uFEFF' + headers + rows;
      mimeType = 'text/csv';
      extension = 'csv';
    }

    return {
      content,
      mimeType,
      filename: `group_statistics_${groupDetails.group_name}_${new Date().toISOString().split('T')[0]}.${extension}`,
    };
  }
}

export const exportService = new ExportService();
