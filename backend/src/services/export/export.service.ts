import { exportModel } from '@models/export/export.model';
import { CreateExportInput } from '@validators/export.validator';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { ForbiddenError } from '@utils/errors';
import path from 'path';
// import fs from 'fs/promises'; // Descomentar para implementación real

export class ExportService {
  async createExport(input: CreateExportInput, userId: UUID) {
    const submission = await submissionModel.getById(
      input.submissionId as UUID
    );

    // TODO: Simular generación de archivo
    // En un caso real: generar CSV/JSON, escribir a disco (ej: /tmp o S3)
    const fileName = `export_${submission.id}_${Date.now()}.${input.format}`;
    const filePath = path.join('/exports', fileName); // Ruta virtual

    const fileSize = Buffer.byteLength(submission.code, 'utf8') + 500;

    return await exportModel.create(input, filePath, fileSize, userId);
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
