import { PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '@config/database';
import {
  SubmissionEntity,
  SubmissionTestResultEntity,
} from './submission.entity';
import { SubmissionRow } from './submission.row';
import {
  UUID,
  SubmissionStatus,
  SubmissionVerdict,
} from '@CustomTypes/common.types';
import { logger } from '@utils/logger';
import { submissionMapper } from '@mappers/submission.mapper';
import { NotFoundError } from '@utils/errors';

export class SubmissionModel {
  /**
   * Obtiene una sumisión por ID
   */
  async getById(id: UUID): Promise<SubmissionEntity> {
    const query = `SELECT * FROM submissions WHERE id = ? LIMIT 1`;
    const [rows] = await getPool().execute<SubmissionRow[]>(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundError(`Envío con id: ${id}`);
    }

    return submissionMapper.toEntity(rows[0]);
  }

  async getNextAttemptNumber(
    studentId: UUID,
    exerciseId: UUID
  ): Promise<number> {
    const query = `SELECT MAX(attempt_number) as maxAttempt FROM submissions WHERE student_id = ? AND exercise_id = ?`;
    const [rows] = await getPool().execute<any[]>(query, [
      studentId,
      exerciseId,
    ]);

    return (rows[0].maxAttempt || 0) + 1;
  }

  async create(data: {
    id: UUID;
    exerciseId: UUID;
    studentId: UUID;
    courseId: UUID;
    code: string;
    language: string;
    attemptNumber: number;
    isLate: boolean;
  }): Promise<SubmissionEntity> {
    const query = `
      INSERT INTO submissions (
        id, exercise_id, student_id, course_id, attempt_number, code, language,
        status, verdict, score, is_late, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())
    `;

    await getPool().execute(query, [
      data.id,
      data.exerciseId,
      data.studentId,
      data.courseId,
      data.attemptNumber,
      data.code,
      data.language,
      SubmissionStatus.PENDING,
      SubmissionVerdict.PENDING,
      data.isLate,
    ]);

    return this.getById(data.id);
  }

  /**
   * Actualiza el resultado de una sumisión y guarda resultados de tests
   */
  async updateResult(
    submissionId: UUID,
    verdict: SubmissionVerdict,
    score: number,
    testResults: SubmissionTestResultEntity[]
  ): Promise<SubmissionEntity> {
    await withTransaction(async (connection: PoolConnection) => {
      const updateQuery = `
        UPDATE submissions 
        SET status = ?, verdict = ?, score = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      await connection.execute(updateQuery, [
        SubmissionStatus.COMPLETED,
        verdict,
        score,
        submissionId,
      ]);

      if (testResults.length > 0) {
        // ACTUALIZADO: Inclusión de error_id en la inserción
        const insertTestQuery = `
          INSERT INTO submission_test_results (
            id, submission_id, test_case_id, status, actual_output, error_id,
            execution_time_ms, memory_used_mb, efficiency_achieved
          ) VALUES ?
        `;

        const values = testResults.map((t) => [
          t.id,
          t.submissionId,
          t.testCaseId,
          t.status,
          t.actualOutput,
          t.errorId || null,
          t.executionTimeMs,
          t.memoryUsedMb,
          t.efficiencyAchieved,
        ]);

        await connection.query(insertTestQuery, [values]);
      }
    });

    logger.info(
      `Submission actualizada: ${submissionId} (Verdict: ${verdict})`
    );

    const updatedEntity = await this.getById(submissionId);
    updatedEntity.testResults = testResults;

    return updatedEntity;
  }
}

export const submissionModel = new SubmissionModel();
