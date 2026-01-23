import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { getPool, withTransaction } from '@config/database';
import {
  UUID,
  PaginatedResponse,
  EfficiencyOrder,
} from '@CustomTypes/common.types';
import { ExerciseEntity } from './exercise.entity';
import { TestCaseEntity, ExecutionLimitEntity } from './exercise.types';
import { ExerciseRow, TestCaseRow, ExecutionLimitRow } from './exercise.row';
import { exerciseMapper } from '@mappers/exercise.mapper';
import { NotFoundError } from '@utils/errors';
import { CreateExerciseInput } from '@validators/exercise.validator';
import { v4 as uuidv4 } from 'uuid';

export class ExerciseModel {
  async createTransactional(
    exerciseId: UUID,
    input: CreateExerciseInput,
    createdById: UUID
  ): Promise<ExerciseEntity> {
    await withTransaction(async (connection: PoolConnection) => {
      const exerciseQuery = `
        INSERT INTO exercises (
          id, syllabus_id, title, description, difficulty, language,
          template_code, is_published, created_by, order_index, points,
          efficiency_order, deadline, late_deadline, late_submission_penalty_percent, max_attempts,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const exerciseValues = [
        exerciseId,
        input.syllabusId,
        input.title,
        input.description,
        input.difficulty,
        input.language,
        input.templateCode ?? null,
        0,
        createdById,
        input.orderIndex ?? null,
        input.points,
        input.efficiencyOrder ?? EfficiencyOrder.ANY,
        input.deadline ?? null,
        input.lateDeadline ?? null,
        input.lateSubmissionPenaltyPercent ?? 0,
        input.maxAttempts ?? 10,
      ];

      await connection.execute(exerciseQuery, exerciseValues);

      const limitId = uuidv4();
      const limitsQuery = `
        INSERT INTO execution_limits (
          id, exercise_id, language, time_limit_seconds, memory_limit_mb, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const timeLimit = input.limits?.timeLimitSeconds ?? 5;
      const memLimit = input.limits?.memoryLimitMb ?? 256;

      await connection.execute(limitsQuery, [
        limitId,
        exerciseId,
        input.language,
        timeLimit,
        memLimit,
      ]);

      if (input.testCases && input.testCases.length > 0) {
        const testCaseQuery = `
          INSERT INTO test_cases (
            id, exercise_id, input, expected_output, runner_code, is_hidden, order_index,
            time_limit_seconds, memory_limit_mb, efficiency_order,
            hint_text, hint_penalty_percent, available_from, created_at, updated_at
          ) VALUES ?
        `;

        const testCaseValues = input.testCases.map((tc, index) => [
          uuidv4(),
          exerciseId,
          tc.input,
          tc.expectedOutput,
          tc.runnerCode || null,
          tc.isHidden,
          index + 1,
          tc.timeLimitSeconds,
          tc.memoryLimitMb,
          input.efficiencyOrder,
          tc.hintText || null,
          tc.hintPenaltyPercent,
          tc.availableFrom || null,
          new Date(),
          new Date(),
        ]);

        await connection.query(testCaseQuery, [testCaseValues]);
      }
    });

    return this.getById(exerciseId);
  }

  async getById(id: UUID): Promise<ExerciseEntity & { courseId: UUID }> {
    const query = `
      SELECT e.*, s.course_id 
      FROM exercises e
      JOIN syllabi s ON e.syllabus_id = s.id
      WHERE e.id = ? LIMIT 1
    `;

    const [rows] = await getPool().execute<any[]>(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundError(`Ejercicio con id: ${id}`);
    }

    const entity = exerciseMapper.toEntity(rows[0]);

    return { ...entity, courseId: rows[0].course_id };
  }

  async updateTransactional(
    exerciseId: UUID,
    input: CreateExerciseInput
  ): Promise<ExerciseEntity> {
    await withTransaction(async (connection: PoolConnection) => {
      const updateQuery = `
        UPDATE exercises SET
          syllabus_id = ?, title = ?, description = ?, difficulty = ?, 
          language = ?, template_code = ?, points = ?, max_attempts = ?,
          late_submission_penalty_percent = ?, deadline = ?, late_deadline = ?, is_published = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      await connection.execute(updateQuery, [
        input.syllabusId,
        input.title,
        input.description,
        input.difficulty,
        input.language,
        input.templateCode ?? null,
        input.points,
        input.maxAttempts ?? 10,
        input.lateSubmissionPenaltyPercent ?? 0,
        input.deadline ?? null,
        input.lateDeadline ?? null,
        false,
        exerciseId,
      ]);

      await connection.execute(
        'DELETE FROM execution_limits WHERE exercise_id = ?',
        [exerciseId]
      );

      const limitId = uuidv4();
      const limitsQuery = `
        INSERT INTO execution_limits (id, exercise_id, language, time_limit_seconds, memory_limit_mb, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await connection.execute(limitsQuery, [
        limitId,
        exerciseId,
        input.language,
        input.limits?.timeLimitSeconds ?? 5,
        input.limits?.memoryLimitMb ?? 256,
      ]);

      await connection.execute('DELETE FROM test_cases WHERE exercise_id = ?', [
        exerciseId,
      ]);

      if (input.testCases && input.testCases.length > 0) {
        const testCaseQuery = `
          INSERT INTO test_cases (
            id, exercise_id, input, expected_output, runner_code, is_hidden, order_index,
            time_limit_seconds, memory_limit_mb, efficiency_order,
            hint_text, hint_penalty_percent, available_from, created_at, updated_at
          ) VALUES ?
        `;

        const testCaseValues = input.testCases.map((tc, index) => [
          uuidv4(),
          exerciseId,
          tc.input,
          tc.expectedOutput,
          tc.runnerCode || null,
          tc.isHidden,
          index + 1,
          tc.timeLimitSeconds,
          tc.memoryLimitMb,
          input.efficiencyOrder,
          tc.hintText || null,
          tc.hintPenaltyPercent,
          tc.availableFrom || null,
          new Date(),
          new Date(),
        ]);

        await connection.query(testCaseQuery, [testCaseValues]);
      }
    });

    return this.getById(exerciseId);
  }

  async listBySyllabus(
    syllabusId: UUID,
    page: number,
    limit: number,
    onlyPublished: boolean = false
  ): Promise<PaginatedResponse<ExerciseEntity>> {
    const offset = (page - 1) * limit;

    let whereClause = 'syllabus_id = ?';
    const params: (string | number)[] = [syllabusId];

    if (onlyPublished) {
      whereClause += ' AND is_published = 1';
    }

    // Count
    const countQuery = `SELECT COUNT(*) as total FROM exercises WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<any[]>(countQuery, params);
    const total = countRows[0].total;

    // Data
    const query = `
      SELECT * FROM exercises 
      WHERE ${whereClause} 
      ORDER BY order_index ASC, created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await getPool().query<ExerciseRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);

    const items = rows.map((row) => exerciseMapper.toEntity(row));

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listByCourse(courseId: UUID): Promise<ExerciseEntity[]> {
    const query = `
      SELECT e.* 
      FROM exercises e
      JOIN syllabi s ON e.syllabus_id = s.id
      WHERE s.course_id = ?
      ORDER BY s.order_index ASC, e.order_index ASC
    `;

    const [rows] = await getPool().execute<ExerciseRow[]>(query, [courseId]);
    return rows.map((row) => exerciseMapper.toEntity(row));
  }

  async listAll(
    page: number,
    limit: number,
    search?: string
  ): Promise<PaginatedResponse<ExerciseEntity>> {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let whereClause = '1=1';

    if (search) {
      whereClause += ' AND title LIKE ?';
      params.push(`%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) as total FROM exercises WHERE ${whereClause}`;
    const [countRows] = await getPool().execute<any[]>(countQuery, params);
    const total = countRows[0].total;

    const query = `
      SELECT * FROM exercises 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await getPool().execute<ExerciseRow[]>(query, [
      ...params,
      limit,
      offset,
    ]);

    return {
      items: rows.map((row) => exerciseMapper.toEntity(row)),
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async setPublishedStatus(
    id: UUID,
    isPublished: boolean
  ): Promise<ExerciseEntity> {
    const query = `UPDATE exercises SET is_published = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await getPool().execute<ResultSetHeader>(query, [
      isPublished,
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new NotFoundError(`Ejercicio con id: ${id}`);
    }

    return this.getById(id);
  }

  // --- Test Cases & Limits ---

  async getTestCases(exerciseId: UUID): Promise<TestCaseEntity[]> {
    const query = `SELECT * FROM test_cases WHERE exercise_id = ? ORDER BY order_index ASC`;
    const [rows] = await getPool().execute<TestCaseRow[]>(query, [exerciseId]);
    return rows.map((row) => exerciseMapper.toTestCaseEntity(row));
  }

  async getExecutionLimits(
    exerciseId: UUID,
    language: string
  ): Promise<ExecutionLimitEntity | null> {
    const query = `SELECT * FROM execution_limits WHERE exercise_id = ? AND language = ? LIMIT 1`;
    const [rows] = await getPool().execute<ExecutionLimitRow[]>(query, [
      exerciseId,
      language,
    ]);
    return rows.length > 0
      ? exerciseMapper.toExecutionLimitEntity(rows[0])
      : null;
  }

  async findByProfessor(teacherId: UUID): Promise<any[]> {
    const query = `
      SELECT 
        e.*,
        s.title as syllabus_title,
        c.academic_year,
        subj.name as subject_name,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.exercise_id = e.id AND sub.archived = FALSE) as submission_count
      FROM exercises e
      JOIN syllabi s ON e.syllabus_id = s.id
      JOIN courses c ON s.course_id = c.id
      JOIN subjects subj ON c.subject_id = subj.id
      WHERE e.created_by = ?
        AND c.status IN ('active', 'planning')
        AND subj.status = 'active'
      ORDER BY e.created_at DESC
    `;

    const [rows] = await getPool().execute<any[]>(query, [teacherId]);

    return rows;
  }

  async updateField(id: UUID, field: string, value: any): Promise<void> {
    const query = `UPDATE exercises SET ${field} = ? WHERE id = ?`;
    await getPool().execute(query, [value, id]);
  }

  async exists(id: UUID): Promise<boolean> {
    const query = `SELECT 1 FROM exercises WHERE id = ? LIMIT 1`;
    const [rows] = await getPool().execute<any[]>(query, [id]);

    return rows.length > 0;
  }

  async delete(id: UUID): Promise<void> {
    await withTransaction(async (connection: PoolConnection) => {
      await connection.execute('DELETE FROM test_cases WHERE exercise_id = ?', [
        id,
      ]);

      await connection.execute(
        'DELETE FROM execution_limits WHERE exercise_id = ?',
        [id]
      );

      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM exercises WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundError(`Ejercicio con id: ${id}`);
      }
    });
  }
}

export const exerciseModel = new ExerciseModel();
