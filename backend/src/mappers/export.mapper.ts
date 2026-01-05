import { BaseMapper } from '@utils/mapper';
import {
  ExportEntity,
  ExportDTO,
  ExportFormat,
  ExportPurpose,
} from '@models/export/export.entity';
import { ExportRow } from '@models/export/export.row';
import { UUID } from '@CustomTypes/common.types';

class ExportMapper extends BaseMapper<ExportEntity, ExportDTO, ExportRow> {
  toEntity(row: ExportRow): ExportEntity {
    return {
      id: row.id as UUID,
      submissionId: row.submission_id as UUID,
      exportFormat: row.export_format as ExportFormat,
      exportPath: row.export_path,
      purpose: row.purpose as ExportPurpose,
      fileSizeBytes: row.file_size_bytes,
      exportedBy: row.exported_by as UUID,
      createdAt: new Date(row.created_at),
    };
  }

  toDTO(entity: ExportEntity): ExportDTO {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      format: entity.exportFormat,
      purpose: entity.purpose,
      sizeBytes: entity.fileSizeBytes,
      createdAt: entity.createdAt,
      downloadUrl: `/api/v1/exports/${entity.id}/download`,
    };
  }
}

export const exportMapper = new ExportMapper();
