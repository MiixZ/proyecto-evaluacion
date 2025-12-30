import { BaseMapper } from '@utils/mapper';
import {
  PlagiarismEntity,
  PlagiarismDTO,
} from '@models/plagiarism/plagiarism.entity';
import { PlagiarismRow } from '@models/plagiarism/plagiarism.row';
import { UUID, PlagiarismType } from '@CustomTypes/common.types';

class PlagiarismMapper extends BaseMapper<
  PlagiarismEntity,
  PlagiarismDTO,
  PlagiarismRow
> {
  toEntity(row: PlagiarismRow): PlagiarismEntity {
    return {
      id: row.id as UUID,
      submissionId: row.submission_id as UUID,
      comparedWithSubmissionId: row.compared_with_submission_id as UUID,
      similarityPercent: Number(row.similarity_percent),
      plagiarismType: row.plagiarism_type as PlagiarismType,
      toolUsed: row.tool_used,
      toolReportUrl: row.tool_report_url,
      isFlagged: Boolean(row.is_flagged),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
      reviewedBy: row.reviewed_by ? (row.reviewed_by as UUID) : null,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  toDTO(entity: PlagiarismEntity): PlagiarismDTO {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      comparedWithSubmissionId: entity.comparedWithSubmissionId,
      similarityPercent: entity.similarityPercent,
      plagiarismType: entity.plagiarismType,
      isFlagged: entity.isFlagged,
      reviewedAt: entity.reviewedAt,
      reviewedBy: entity.reviewedBy,
      notes: entity.notes,
      createdAt: entity.createdAt,
    };
  }
}

export const plagiarismMapper = new PlagiarismMapper();
