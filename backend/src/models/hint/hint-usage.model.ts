import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { HintUsageEntity } from './hint-usage.entity';
import { HintUsageRow } from './hint-usage.row';
import { UUID } from '@CustomTypes/common.types';
import { hintMapper } from '@mappers/hint.mapper';

export class HintUsageModel {
  /**
   * Registra el uso de una pista
   */
  async create(data: {
    submissionId: UUID;
    testCaseId: UUID;
    hintText: string;
    penaltyApplied: number;
  }): Promise<HintUsageEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO hint_usage (
        id, submission_id, test_case_id, hint_text, penalty_applied, used_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await getPool().execute(query, [
      id,
      data.submissionId,
      data.testCaseId,
      data.hintText,
      data.penaltyApplied,
    ]);

    return {
      id: id as UUID,
      submissionId: data.submissionId,
      testCaseId: data.testCaseId,
      hintText: data.hintText,
      penaltyApplied: data.penaltyApplied,
      usedAt: new Date(),
    };
  }

  /**
   * Verifica si una pista ya ha sido revelada para un envío y caso de prueba
   */
  async findBySubmissionAndTestCase(
    submissionId: UUID,
    testCaseId: UUID
  ): Promise<HintUsageEntity | null> {
    const query = `
      SELECT * FROM hint_usage 
      WHERE submission_id = ? AND test_case_id = ? 
      LIMIT 1
    `;

    const [rows] = await getPool().execute<HintUsageRow[]>(query, [
      submissionId,
      testCaseId,
    ]);

    if (rows.length === 0) return null;

    return hintMapper.toEntity(rows[0]);
  }
}

export const hintUsageModel = new HintUsageModel();
