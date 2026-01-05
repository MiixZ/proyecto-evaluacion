import { RowDataPacket } from 'mysql2';
import {
  SubmissionEntity,
  SubmissionTestResultEntity,
  SubmissionDTO,
} from './submission.entity';
import { SubmissionVerdict } from '@CustomTypes/common.types';
import { submissionMapper } from '@mappers/submission.mapper';
import { getPool } from '@config/database';
import { SubmissionRow } from './submission.row';

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

interface SubmissionDetailRow extends RowDataPacket {
  id: string;
  code: string;
  language: string;
  status: string;
  verdict: string;
  score: number;
  created_at: Date;

  student_id: string;
  student_name: string;
  student_email: string;
  student_avatar: string;

  exercise_id: string;
  exercise_title: string;
  exercise_difficulty: string;

  tr_id: string;
  tr_status: string;
  tr_actual: string;
  tr_time: number;
  tr_memory: number;
  tr_error_msg: string;

  tc_input: string;
  tc_expected: string;
}

interface SubmissionListRow extends RowDataPacket {
  id: string;
  exercise_id: string;
  exercise_title: string;
  subject_name: string;
  verdict: string;
  score: number;
  created_at: Date;
  language: string;
  execution_time_ms: number;
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

  async getDetailsById(id: string): Promise<any | null> {
    const query = `
      SELECT 
        s.id, s.code, s.language, s.status, s.verdict, s.score, s.created_at,
        u.id as student_id, CONCAT(u.first_name, ' ', u.last_name) as student_name, u.email as student_email, u.profile_image_url as student_avatar,
        e.id as exercise_id, e.title as exercise_title, e.difficulty as exercise_difficulty,
        str.id as tr_id, str.status as tr_status, str.actual_output as tr_actual, 
        str.execution_time_ms as tr_time, str.memory_used_mb as tr_memory,
        se.error_message as tr_error_msg,
        tc.input as tc_input, tc.expected_output as tc_expected, tc.is_hidden as tc_is_hidden
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN exercises e ON s.exercise_id = e.id
      LEFT JOIN submission_test_results str ON s.id = str.submission_id
      LEFT JOIN test_cases tc ON str.test_case_id = tc.id
      LEFT JOIN submission_errors se ON str.error_id = se.id
      WHERE s.id = ?
      ORDER BY tc.order_index ASC
    `;

    const [rows] = await getPool().query<SubmissionDetailRow[]>(query, [id]);

    if (rows.length === 0) return null;

    const base = rows[0];

    return {
      id: base.id,
      code: base.code,
      language: base.language,
      status: base.status,
      verdict: base.verdict,
      score: base.score,
      createdAt: base.created_at,
      executionTimeMs: rows.reduce((acc, r) => acc + (r.tr_time || 0), 0),
      memoryUsedMb: Math.max(...rows.map((r) => r.tr_memory || 0)),
      student: {
        id: base.student_id,
        name: base.student_name,
        email: base.student_email,
        avatarUrl: base.student_avatar,
      },
      exercise: {
        id: base.exercise_id,
        title: base.exercise_title,
        difficulty: base.exercise_difficulty,
      },
      testResults: rows
        .filter((r) => r.tr_id)
        .map((r) => ({
          id: r.tr_id,
          status: r.tr_status,
          input: r.tc_input,
          expectedOutput: r.tc_expected,
          actualOutput: r.tr_actual,
          executionTimeMs: r.tr_time,
          memoryUsedMb: r.tr_memory,
          errorMessage: r.tr_error_msg,
          isHidden: r.tc_is_hidden,
        })),
    };
  }

  /**
   * Obtiene los test results de una submission con detalles de los test cases
   * Filtra input/expectedOutput según el rol del usuario (oculta si isHidden = true para estudiantes)
   */
  async getTestResultsWithDetails(
    submissionId: string,
    userRole: string
  ): Promise<any[]> {
    const query = `
      SELECT 
        str.id, str.status, str.actual_output, str.execution_time_ms, str.memory_used_mb,
        tc.input, tc.expected_output, tc.is_hidden,
        se.error_message
      FROM submission_test_results str
      LEFT JOIN test_cases tc ON str.test_case_id = tc.id
      LEFT JOIN submission_errors se ON str.error_id = se.id
      WHERE str.submission_id = ?
      ORDER BY tc.order_index ASC
    `;

    const [rows] = await getPool().query<any[]>(query, [submissionId]);

    return rows.map((row) => {
      const isStudent = userRole === 'student';
      const shouldHide = isStudent && row.is_hidden;

      return {
        id: row.id,
        testCaseId: row.test_case_id,
        status: row.status,
        actualOutput: row.actual_output,
        executionTimeMs: row.execution_time_ms,
        memoryUsedMb: row.memory_used_mb,
        // Solo incluir input/expectedOutput si NO está oculto o si es profesor/admin
        input: shouldHide ? undefined : row.input,
        expectedOutput: shouldHide ? undefined : row.expected_output,
        hintText: null,
        errorMessage: row.error_message,
      };
    });
  }

  async updateScore(id: string, score: number): Promise<void> {
    await getPool().query('UPDATE submissions SET score = ? WHERE id = ?', [
      score,
      id,
    ]);
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

  async countRecentSubmissions(
    studentId: string,
    exerciseId: string,
    minutes: number
  ): Promise<number> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT COUNT(*) as count 
       FROM submissions 
       WHERE student_id = ? 
       AND exercise_id = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [studentId, exerciseId, minutes]
    );

    return rows[0].count;
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
        hu.hint_text as tr_hint_text,
        tc.input as tc_input, tc.expected_output as tc_expected_output, tc.is_hidden as tc_is_hidden
      FROM submissions s
      LEFT JOIN submission_test_results str ON s.id = str.submission_id
      LEFT JOIN test_cases tc ON str.test_case_id = tc.id
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
          // Solo incluir input/expectedOutput si NO está oculto
          input: row.tc_is_hidden ? undefined : row.tc_input,
          expectedOutput: row.tc_is_hidden ? undefined : row.tc_expected_output,
        });
      }
    });

    return Array.from(submissionsMap.values()).map((entity) =>
      submissionMapper.toDTO(entity)
    );
  }

  async findAllByUser(userId: string): Promise<any[]> {
    const [rows] = await getPool().query<SubmissionListRow[]>(
      `SELECT 
        s.id, s.exercise_id, s.verdict, s.score, s.created_at, s.language,
        e.title as exercise_title,
        subj.name as subject_name,
        c.id as course_id
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      JOIN courses c ON s.course_id = c.id
      JOIN subjects subj ON c.subject_id = subj.id
      WHERE s.student_id = ?
      ORDER BY s.created_at DESC`,
      [userId]
    );

    return rows.map((row) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseTitle: row.exercise_title,
      subjectName: row.subject_name,
      courseId: row.course_id,
      verdict: row.verdict,
      score: row.score,
      createdAt: row.created_at,
      language: row.language,
    }));
  }

  async findAllByExerciseId(exerciseId: string): Promise<any[]> {
    const [rows] = await getPool().query<SubmissionListRow[]>(
      `SELECT 
      s.id, s.exercise_id, s.verdict, s.score, s.created_at, s.language,
      e.title as exercise_title,
      subj.name as subject_name,
      c.id as course_id,
      u.id as student_id,
      CONCAT(u.first_name, ' ', u.last_name) as student_name
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      JOIN courses c ON s.course_id = c.id
      JOIN subjects subj ON c.subject_id = subj.id
      JOIN users u ON s.student_id = u.id
      WHERE s.exercise_id = ?
      ORDER BY s.created_at DESC`,
      [exerciseId]
    );

    return rows.map((row) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseTitle: row.exercise_title,
      subjectName: row.subject_name,
      courseId: row.course_id,
      verdict: row.verdict,
      score: row.score,
      createdAt: row.created_at,
      language: row.language,
      student: {
        id: row.student_id,
        name: row.student_name,
      },
    }));
  }

  async penalize(
    id: string,
    verdict: SubmissionVerdict,
    score: number
  ): Promise<void> {
    await getPool().query(
      `UPDATE submissions 
       SET verdict = ?, score = ?, status = 'completed' 
       WHERE id = ?`,
      [verdict, score, id]
    );
  }
}

export const submissionModel = new SubmissionModel();
