import { BaseMapper } from '@utils/mapper';
import {
  FeedbackEntity,
  FeedbackDTO,
  FeedbackVisibility,
} from '@models/feedback/feedback.entity';
import { FeedbackRow } from '@models/feedback/feedback.row';
import { UUID } from '@CustomTypes/common.types';

class FeedbackMapper extends BaseMapper<
  FeedbackEntity,
  FeedbackDTO,
  FeedbackRow
> {
  toEntity(row: FeedbackRow): FeedbackEntity {
    return {
      id: row.id as UUID,
      submissionId: row.submission_id as UUID,
      teacherId: row.teacher_id as UUID,
      content: row.content,
      isGeneral: Boolean(row.is_general),
      lineNumber: row.line_number,
      scoreAdjustment: row.score_adjustment,
      visibility: row.visibility as FeedbackVisibility,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: FeedbackEntity): FeedbackDTO {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      teacherId: entity.teacherId,
      content: entity.content,
      isGeneral: entity.isGeneral,
      lineNumber: entity.lineNumber,
      scoreAdjustment: entity.scoreAdjustment,
      visibility: entity.visibility,
      createdAt: entity.createdAt,
    };
  }
}

export const feedbackMapper = new FeedbackMapper();
