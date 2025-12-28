import { PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '@config/database';
import { SubmissionTestResultEntity } from './submission.entity';
import {
  UUID,
  SubmissionStatus,
  SubmissionVerdict,
} from '@CustomTypes/common.types';
import { logger } from '@utils/logger';

export class SubmissionModel {
  /**
   * Obtiene el siguiente número de intento para un estudiante en un ejercicio
   */
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

  /**
   * Crea la sumisión inicial en estado PENDING
   */
  async create(data: {
    id: UUID;
    exerciseId: UUID;
    studentId: UUID;
    courseId: UUID;
    code: string;
    language: string;
    attemptNumber: number;
    isLate: boolean;
  }): Promise<void> {
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
  }

  /**
   * Actualiza el resultado de una sumisión tras la ejecución
   * Incluye guardar los resultados de los test cases en una transacción
   */
  async updateResult(
    submissionId: UUID,
    verdict: SubmissionVerdict,
    score: number,
    testResults: SubmissionTestResultEntity[]
  ): Promise<void> {
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
        const insertTestQuery = `
          INSERT INTO submission_test_results (
            id, submission_id, test_case_id, status, actual_output, 
            execution_time_ms, memory_used_mb, efficiency_achieved
          ) VALUES ?
        `;

        const values = testResults.map((t) => [
          t.id,
          t.submissionId,
          t.testCaseId,
          t.status,
          t.actualOutput,
          t.executionTimeMs,
          t.memoryUsedMb,
          t.efficiencyAchieved,
        ]);

        await connection.query(insertTestQuery, [values]);
      }
    });

    logger.info(
      `Submission actualizada: ${submissionId} - Verdict: ${verdict}`
    );
  }
}

export const submissionModel = new SubmissionModel();
