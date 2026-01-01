import { exportModel } from '@models/export/export.model';
import { CreateExportInput } from '@validators/export.validator';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
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
    const virtualPath = `virtual://${input.format}/${submission.id}.${extension}`;

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
      filename: `export_sub_${submission.attemptNumber}_${submission.studentId}.${extension}`,
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
      filename: `export_sub_${submission.attemptNumber}_${submission.studentId}.${extension}`,
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
      content = headers + row;
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
}

export const exportService = new ExportService();
