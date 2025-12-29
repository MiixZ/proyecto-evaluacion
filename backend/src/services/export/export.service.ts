import { exportModel } from '@models/export/export.model';
import { CreateExportInput } from '@validators/export.validator';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { ForbiddenError } from '@utils/errors';
import { ExportFormat } from '@models/export/export.entity';
// import path from 'path';
// import fs from 'fs/promises';

export class ExportService {
  async createExport(input: CreateExportInput, userId: UUID) {
    const submission = await submissionModel.getById(
      input.submissionId as UUID
    );

    let content = '';
    const timestamp = Date.now();

    if (input.format === ExportFormat.JSON) {
      content = JSON.stringify(
        {
          meta: {
            generatedAt: new Date(),
            requestedBy: userId,
          },
          data: submission,
        },
        null,
        2
      );
    } else if (input.format === ExportFormat.CSV) {
      const headers =
        'id,studentId,exerciseId,language,verdict,score,createdAt,code\n';

      const safeCode = submission.code.replace(/"/g, '""');
      const row = `${submission.id},${submission.studentId},${submission.exerciseId},${submission.language},${submission.verdict},${submission.score},${submission.createdAt},"${safeCode}"`;
      content = headers + row;
    } else {
      content = submission.code;
    }

    const fileName = `export_${submission.id}_${timestamp}.${input.format}`;
    const virtualPath = `/exports/${fileName}`;
    const fileSize = Buffer.byteLength(content, 'utf8');

    return await exportModel.create(input, virtualPath, fileSize, userId);
  }

  async getExportById(id: string, userRole: UserRole) {
    const exportEntity = await exportModel.getById(id as UUID);

    if (userRole === UserRole.STUDENT) {
      throw new ForbiddenError(
        'No tienes permisos para acceder a esta exportación'
      );
    }

    return exportEntity;
  }

  async listExports(
    page: number,
    limit: number,
    filters: { purpose?: string; format?: string }
  ) {
    return await exportModel.list(page, limit, filters);
  }
}

export const exportService = new ExportService();
