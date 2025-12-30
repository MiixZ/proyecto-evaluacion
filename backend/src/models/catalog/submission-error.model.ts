import { getPool } from '@config/database';
import { SubmissionErrorEntity } from './submission-error.entity';
import { SubmissionErrorRow } from './submission-error.row';
import { submissionErrorMapper } from '@mappers/submission-error.mapper';

export class SubmissionErrorModel {
  async findAll(): Promise<SubmissionErrorEntity[]> {
    const query = 'SELECT * FROM submission_errors WHERE is_active = 1';
    const [rows] = await getPool().execute<SubmissionErrorRow[]>(query);
    return rows.map((row) => submissionErrorMapper.toEntity(row));
  }

  async findByType(type: string): Promise<SubmissionErrorEntity | null> {
    const query =
      'SELECT * FROM submission_errors WHERE error_type = ? LIMIT 1';
    const [rows] = await getPool().execute<SubmissionErrorRow[]>(query, [type]);

    if (rows.length === 0) return null;
    return submissionErrorMapper.toEntity(rows[0]);
  }
}

export const submissionErrorModel = new SubmissionErrorModel();
