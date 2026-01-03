import { PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '@config/database';
import {
  SubmissionDTO,
  SubmissionEntity,
  SubmissionTestResultEntity,
} from './submission.entity';
import { SubmissionJoinRow, SubmissionRow } from './submission.row';
import {
  UUID,
  SubmissionStatus,
  SubmissionVerdict,
} from '@CustomTypes/common.types';
import { logger } from '@utils/logger';
import { submissionMapper } from '@mappers/submission.mapper';
import { NotFoundError } from '@utils/errors';
import { CountResult } from '@models/common/count.row';

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

  async countAttempts(studentId: UUID, exerciseId: UUID): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM submissions WHERE student_id = ? AND exercise_id = ?`;
    const [rows] = await getPool().execute<CountResult[]>(query, [
      studentId,
      exerciseId,
    ]);

    return rows[0].count;
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

  async findByUserAndExercise(
    userId: string,
    exerciseId: string
  ): Promise<SubmissionDTO[]> {
    const [rows] = await getPool().query<SubmissionJoinRow[]>(
      `SELECT 
        s.id as s_id, s.exercise_id as s_exercise_id, s.student_id as s_student_id, 
        s.course_id as s_course_id, s.attempt_number as s_attempt_number, s.code as s_code, 
        s.language as s_language, s.status as s_status, s.verdict as s_verdict, 
        s.score as s_score, s.is_late as s_is_late, s.created_at as s_created_at,
        
        str.id as tr_id, str.test_case_id as tr_test_case_id, str.status as tr_status, 
        str.actual_output as tr_actual_output, str.execution_time_ms as tr_execution_time_ms, 
        str.memory_used_mb as tr_memory_used_mb
      FROM submissions s
      LEFT JOIN submission_test_results str ON s.id = str.submission_id
      WHERE s.student_id = ? AND s.exercise_id = ?
      ORDER BY s.attempt_number DESC, str.created_at ASC`,
      [userId, exerciseId]
    );

    const submissionsMap = new Map<string, any>();

    rows.forEach((row) => {
      if (!submissionsMap.has(row.s_id)) {
        submissionsMap.set(row.s_id, {
          id: row.s_id,
          exerciseId: row.s_exercise_id,
          studentId: row.s_student_id,
          courseId: row.s_course_id,
          attemptNumber: row.s_attempt_number,
          code: row.s_code,
          language: row.s_language,
          status: row.s_status,
          verdict: row.s_verdict,
          score: row.s_score,
          isLate: !!row.s_is_late,
          createdAt: row.s_created_at,
          testResults: [],
        });
      }

      if (row.tr_id) {
        submissionsMap.get(row.s_id).testResults.push({
          id: row.tr_id,
          testCaseId: row.tr_test_case_id,
          status: row.tr_status,
          actualOutput: row.tr_actual_output,
          executionTimeMs: row.tr_execution_time_ms,
          memoryUsedMb: row.tr_memory_used_mb,
        });
      }
    });

    return Array.from(submissionsMap.values()).map((entity) =>
      submissionMapper.toDTO(entity)
    );
  }
}

export const submissionModel = new SubmissionModel();
