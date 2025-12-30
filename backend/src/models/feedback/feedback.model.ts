import { getPool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { FeedbackEntity } from './feedback.entity';
import { FeedbackRow } from './feedback.row';
import { feedbackMapper } from '@mappers/feedback.mapper';
import {
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from '@validators/feedback.validator';
import { UUID } from '@CustomTypes/common.types';
import { NotFoundError } from '@utils/errors';

export class FeedbackModel {
  async create(
    input: CreateFeedbackInput,
    teacherId: UUID
  ): Promise<FeedbackEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO feedback (
        id, submission_id, teacher_id, content, is_general, line_number, 
        score_adjustment, visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await getPool().execute(query, [
      id,
      input.submissionId,
      teacherId,
      input.content,
      input.isGeneral,
      input.lineNumber || null,
      input.scoreAdjustment,
      input.visibility,
    ]);

    return this.getById(id as UUID);
  }

  async getById(id: UUID): Promise<FeedbackEntity> {
    const [rows] = await getPool().execute<FeedbackRow[]>(
      'SELECT * FROM feedback WHERE id = ?',
      [id]
    );

    if (rows.length === 0) throw new NotFoundError('Feedback con id: ' + id);

    return feedbackMapper.toEntity(rows[0]);
  }

  async listBySubmission(submissionId: UUID): Promise<FeedbackEntity[]> {
    const [rows] = await getPool().execute<FeedbackRow[]>(
      'SELECT * FROM feedback WHERE submission_id = ? ORDER BY created_at DESC',
      [submissionId]
    );

    return rows.map((row) => feedbackMapper.toEntity(row));
  }

  async update(id: UUID, input: UpdateFeedbackInput): Promise<FeedbackEntity> {
    const fields: string[] = [];
    const params: any[] = [];

    if (input.content !== undefined) {
      fields.push('content = ?');
      params.push(input.content);
    }
    if (input.isGeneral !== undefined) {
      fields.push('is_general = ?');
      params.push(input.isGeneral);
    }
    if (input.lineNumber !== undefined) {
      fields.push('line_number = ?');
      params.push(input.lineNumber);
    }
    if (input.scoreAdjustment !== undefined) {
      fields.push('score_adjustment = ?');
      params.push(input.scoreAdjustment);
    }
    if (input.visibility !== undefined) {
      fields.push('visibility = ?');
      params.push(input.visibility);
    }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE feedback SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await getPool().execute<any>(query, params);

    if (result.affectedRows === 0)
      throw new NotFoundError('Feedback con id: ' + id);

    return this.getById(id);
  }

  async delete(id: UUID): Promise<void> {
    const [result] = await getPool().execute<any>(
      'DELETE FROM feedback WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0)
      throw new NotFoundError('Feedback con id: ' + id);
  }
}

export const feedbackModel = new FeedbackModel();
