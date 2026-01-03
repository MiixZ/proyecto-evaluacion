import { RowDataPacket } from 'mysql2';
import {
  SubmissionEntity,
  SubmissionTestResultEntity,
  SubmissionDTO,
} from './submission.entity';
import { SubmissionVerdict } from '@CustomTypes/common.types';
import { submissionMapper } from '@mappers/submission.mapper';
import { getPool } from '@config/database';

interface SubmissionRow extends RowDataPacket {
  id: string;
  exercise_id: string;
  student_id: string;
  course_id: string;
  attempt_number: number;
  code: string;
  language: string;
  status: string;
  verdict: string;
  score: number;
  is_late: number;
  used_hint: number;
  created_at: Date;
  updated_at: Date;
}

interface SubmissionJoinRow extends RowDataPacket {
  s_id: string;
  s_exercise_id: string;
  s_student_id: string;
  s_course_id: string;
  s_attempt_number: number;
  s_code: string;
  s_language: string;
  s_status: string;
  s_verdict: string;
  s_score: number;
  s_is_late: number;
  s_created_at: Date;

  tr_id: string | null;
  tr_test_case_id: string | null;
  tr_status: string | null;
  tr_actual_output: string | null;
  tr_execution_time_ms: number | null;
  tr_memory_used_mb: number | null;
  tr_hint_text: string | null;
}

export class SubmissionModel {
  async getById(id: string): Promise<SubmissionEntity | null> {
    const [rows] = await getPool().query<SubmissionRow[]>(
      'SELECT * FROM submissions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    return submissionMapper.toEntity(rows[0]);
  }

  async create(submission: SubmissionEntity): Promise<void> {
    await getPool().query(
      `INSERT INTO submissions (id, exercise_id, student_id, course_id, attempt_number, code, language, status, is_late)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submission.id,
        submission.exerciseId,
        submission.studentId,
        submission.courseId,
        submission.attemptNumber,
        submission.code,
        submission.language,
        'pending',
        submission.isLate,
      ]
    );
  }

  async updateResult(
    id: string,
    verdict: SubmissionVerdict,
    score: number,
    testResults: SubmissionTestResultEntity[]
  ): Promise<SubmissionEntity> {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE submissions SET verdict = ?, score = ?, status = 'completed' WHERE id = ?`,
        [verdict, score, id]
      );

      if (testResults.length > 0) {
        const values = testResults.map((tr) => [
          tr.id,
          id,
          tr.testCaseId,
          tr.status,
          tr.actualOutput,
          tr.errorId,
          tr.executionTimeMs,
          tr.memoryUsedMb,
          tr.efficiencyAchieved || 'any',
        ]);

        await connection.query(
          `INSERT INTO submission_test_results 
           (id, submission_id, test_case_id, status, actual_output, error_id, execution_time_ms, memory_used_mb, efficiency_achieved)
           VALUES ?`,
          [values]
        );
      }

      await connection.commit();

      const [rows] = await connection.query<SubmissionRow[]>(
        'SELECT * FROM submissions WHERE id = ?',
        [id]
      );

      return submissionMapper.toEntity(rows[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async countAttempts(userId: string, exerciseId: string): Promise<number> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM submissions WHERE student_id = ? AND exercise_id = ?',
      [userId, exerciseId]
    );
    return rows[0].count;
  }

  async getNextAttemptNumber(
    userId: string,
    exerciseId: string
  ): Promise<number> {
    const count = await this.countAttempts(userId, exerciseId);

    return count + 1;
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
        str.memory_used_mb as tr_memory_used_mb,
        hu.hint_text as tr_hint_text
      FROM submissions s
      LEFT JOIN submission_test_results str ON s.id = str.submission_id
      LEFT JOIN hint_usage hu ON s.id = hu.submission_id AND str.test_case_id = hu.test_case_id
      WHERE s.student_id = ? AND s.exercise_id = ?
      ORDER BY s.attempt_number DESC, str.created_at ASC`,
      [userId, exerciseId]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          hintText: row.tr_hint_text,
        });
      }
    });

    return Array.from(submissionsMap.values()).map((entity) =>
      submissionMapper.toDTO(entity)
    );
  }
}

export const submissionModel = new SubmissionModel();
