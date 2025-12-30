import { BaseMapper } from '@utils/mapper';
import { HintUsageEntity, HintUsageDTO } from '@models/hint/hint-usage.entity';
import { HintUsageRow } from '@models/hint/hint-usage.row';
import { UUID } from '@CustomTypes/common.types';

class HintMapper extends BaseMapper<
  HintUsageEntity,
  HintUsageDTO,
  HintUsageRow
> {
  toEntity(row: HintUsageRow): HintUsageEntity {
    return {
      id: row.id as UUID,
      submissionId: row.submission_id as UUID,
      testCaseId: row.test_case_id as UUID,
      hintText: row.hint_text,
      penaltyApplied: row.penalty_applied,
      usedAt: new Date(row.used_at),
    };
  }

  toDTO(entity: HintUsageEntity): HintUsageDTO {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      testCaseId: entity.testCaseId,
      hintText: entity.hintText,
      penaltyApplied: entity.penaltyApplied,
      usedAt: entity.usedAt,
    };
  }
}

export const hintMapper = new HintMapper();
