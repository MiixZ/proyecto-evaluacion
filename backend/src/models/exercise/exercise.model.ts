import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { getPool, withTransaction } from '@config/database';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { ExerciseEntity } from './exercise.entity';
import { TestCaseEntity, ExecutionLimitEntity } from './exercise.types';
import { ExerciseRow, TestCaseRow, ExecutionLimitRow } from './exercise.row';
import { exerciseMapper } from '@mappers/exercise.mapper';
import { NotFoundError } from '@utils/errors';
import {
  CreateExerciseInput,
} from '@validators/exercise.validator';
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
          efficiency_order, deadline, late_submission_penalty_percent, max_attempts,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const exerciseValues = [
        exerciseId,
        input.syllabusId,
        input.title,
        input.description,
        input.difficulty,
        input.language,
        input.templateCode || null,
        0,
        createdById,
        input.orderIndex || null,
        input.points,
        input.efficiencyOrder,
        input.deadline || null,
        input.lateSubmissionPenaltyPercent,
        input.maxAttempts,
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
            id, exercise_id, input, expected_output, is_hidden, order_index,
            time_limit_seconds, memory_limit_mb, efficiency_order,
            hint_text, hint_penalty_percent, created_at, updated_at
          ) VALUES ?
        `;

        const testCaseValues = input.testCases.map((tc, index) => [
          uuidv4(),
          exerciseId,
          tc.input,
          tc.expectedOutput,
          tc.isHidden,
          index + 1,
          tc.timeLimitSeconds,
          tc.memoryLimitMb,
          input.efficiencyOrder,
          tc.hintText || null,
          tc.hintPenaltyPercent,
          new Date(),
          new Date(),
        ]);

        await connection.query(testCaseQuery, [testCaseValues]);
      }
    });

    return this.getById(exerciseId);
  }

  async getById(id: UUID): Promise<ExerciseEntity> {
    const query = `SELECT * FROM exercises WHERE id = ? LIMIT 1`;
    const [rows] = await getPool().execute<ExerciseRow[]>(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundError(`Ejercicio no encontrado: ${id}`);
    }

    return exerciseMapper.toEntity(rows[0]);
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

    const [rows] = await getPool().execute<ExerciseRow[]>(query, [
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
      throw new NotFoundError(`Ejercicio no encontrado: ${id}`);
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
}

export const exerciseModel = new ExerciseModel();
