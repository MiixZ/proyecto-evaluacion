import { BaseMapper } from '@utils/mapper';
import {
  SubmissionErrorEntity,
  SubmissionErrorDTO,
} from '@models/catalog/submission-error.entity';
import { SubmissionErrorRow } from '@models/catalog/submission-error.row';
import { UUID } from '@CustomTypes/common.types';

class SubmissionErrorMapper extends BaseMapper<
  SubmissionErrorEntity,
  SubmissionErrorDTO,
  SubmissionErrorRow
> {
  toEntity(row: SubmissionErrorRow): SubmissionErrorEntity {
    return {
      id: row.id as UUID,
      errorType: row.error_type,
      errorMessage: row.error_message,
      errorDetails:
        typeof row.error_details === 'string'
          ? JSON.parse(row.error_details)
          : row.error_details,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
    };
  }

  toDTO(entity: SubmissionErrorEntity): SubmissionErrorDTO {
    return {
      code: entity.errorType,
      name: entity.errorMessage,
      details: entity.errorDetails,
    };
  }
}

export const submissionErrorMapper = new SubmissionErrorMapper();
