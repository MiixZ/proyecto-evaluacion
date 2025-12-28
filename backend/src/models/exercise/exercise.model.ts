import { RowDataPacket } from 'mysql2/promise';
import { getPool } from '@config/database';
import { logger } from '@utils/logger';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { ExerciseEntity, ExerciseDTO } from './exercise.entity';
import { NotFoundError } from '@utils/errors';
import { ExecutionLimitEntity, TestCaseEntity } from './exercise.types';
import { CreateExerciseInput } from '@validators/submission.validator';

export class ExerciseModel {
  /**
   * Crea un nuevo ejercicio
   */
  async create(
    input: CreateExerciseInput,
    createdById: UUID
  ): Promise<ExerciseEntity> {
    const pool = getPool();

    const query = `
      INSERT INTO exercises (
        id, syllabus_id, title, description, difficulty, language,
        template_code, is_published, created_by, order_index, points,
        efficiency_order, deadline, late_submission_penalty_percent, max_attempts,
        created_at, updated_at
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `;

    const values = [
      input.syllabusId,
      input.title,
      input.description,
      input.difficulty,
      input.language,
      input.templateCode || null,
      false, // is_published
      createdById,
      input.orderIndex || null,
      input.points,
      input.efficiencyOrder,
      input.deadline || null,
      input.lateSubmissionPenaltyPercent,
      input.maxAttempts,
    ];

    const [result] = await pool.execute(query, values);
    const insertedId = (result as any).insertId;

    logger.info(`Ejercicio creado: ${input.title} (ID: ${insertedId})`);

    return this.getById(insertedId as UUID);
  }

  /**
   * Obtiene un ejercicio por ID
   */
  async getById(id: UUID): Promise<ExerciseEntity> {
    const pool = getPool();

    const query = `
      SELECT 
        id, syllabus_id as syllabusId, title, description, difficulty,
        language, template_code as templateCode, is_published as isPublished,
        created_by as createdBy, order_index as orderIndex, points,
        efficiency_order as efficiencyOrder, deadline,
        late_submission_penalty_percent as lateSubmissionPenaltyPercent,
        max_attempts as maxAttempts, created_at as createdAt,
        updated_at as updatedAt
      FROM exercises
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundError(`Ejercicio no encontrado: ${id}`);
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * Obtiene ejercicios por syllabus
   */
  async getBySyllabusId(
    syllabusId: UUID,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ExerciseDTO>> {
    const pool = getPool();
    const offset = (page - 1) * limit;

    // Total
    const countQuery = `SELECT COUNT(*) as total FROM exercises WHERE syllabus_id = ?`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, [
      syllabusId,
    ]);
    const total = (countRows[0] as any).total;

    // Resultados
    const query = `
      SELECT 
        id, syllabus_id as syllabusId, title, description, difficulty,
        language, is_published as isPublished, points, max_attempts as maxAttempts,
        deadline, created_at as createdAt, updated_at as updatedAt
      FROM exercises
      WHERE syllabus_id = ?
      ORDER BY order_index ASC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [
      syllabusId,
      limit,
      offset,
    ]);

    return {
      items: rows.map((row) => this.mapRowToDTO(row)),
      total,
      page,
      limit,
      hasMore: offset + limit < total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene ejercicios publicados de un syllabus (para estudiantes)
   */
  async getPublishedBySyllabusId(syllabusId: UUID): Promise<ExerciseDTO[]> {
    const pool = getPool();

    const query = `
      SELECT 
        id, syllabus_id as syllabusId, title, description, difficulty,
        language, is_published as isPublished, points, max_attempts as maxAttempts,
        deadline, created_at as createdAt, updated_at as updatedAt
      FROM exercises
      WHERE syllabus_id = ? AND is_published = TRUE
      ORDER BY order_index ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [syllabusId]);

    return rows.map((row) => this.mapRowToDTO(row));
  }

  /**
   * Publica un ejercicio
   */
  async publish(id: UUID): Promise<ExerciseEntity> {
    const pool = getPool();

    const query = `
      UPDATE exercises
      SET is_published = TRUE, updated_at = NOW()
      WHERE id = ?
    `;

    const result = await pool.execute(query, [id]);

    if ((result[0] as any).affectedRows === 0) {
      throw new NotFoundError(`Ejercicio no encontrado: ${id}`);
    }

    logger.info(`Ejercicio publicado: ${id}`);

    return this.getById(id);
  }

  async getTestCases(exerciseId: UUID): Promise<TestCaseEntity[]> {
    const query = `
      SELECT id, exercise_id as exerciseId, input, expected_output as expectedOutput, 
             is_hidden as isHidden, time_limit_seconds as timeLimitSeconds, 
             memory_limit_mb as memoryLimitMb
      FROM test_cases 
      WHERE exercise_id = ? 
      ORDER BY order_index ASC
    `;
    const [rows] = await getPool().execute<any[]>(query, [exerciseId]);
    return rows;
  }

  async getExecutionLimits(
    exerciseId: UUID,
    language: string
  ): Promise<ExecutionLimitEntity | null> {
    const query = `
      SELECT id, exercise_id as exerciseId, language, 
             time_limit_seconds as timeLimitSeconds, memory_limit_mb as memoryLimitMb
      FROM execution_limits
      WHERE exercise_id = ? AND language = ?
      LIMIT 1
    `;

    const [rows] = await getPool().execute<any[]>(query, [
      exerciseId,
      language,
    ]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * ============================================================================
   * HELPERS
   * ============================================================================
   */

  private mapRowToEntity(row: RowDataPacket): ExerciseEntity {
    return {
      id: row.id,
      syllabusId: row.syllabusId,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      language: row.language,
      templateCode: row.templateCode,
      isPublished: Boolean(row.isPublished),
      createdBy: row.createdBy,
      orderIndex: row.orderIndex,
      points: row.points,
      efficiencyOrder: row.efficiencyOrder,
      deadline: row.deadline ? new Date(row.deadline) : null,
      lateSubmissionPenaltyPercent: row.lateSubmissionPenaltyPercent,
      maxAttempts: row.maxAttempts,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private mapRowToDTO(row: RowDataPacket): ExerciseDTO {
    return {
      id: row.id,
      syllabusId: row.syllabusId,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      language: row.language,
      isPublished: Boolean(row.isPublished),
      points: row.points,
      maxAttempts: row.maxAttempts,
      deadline: row.deadline ? new Date(row.deadline) : null,
    };
  }
}

export const exerciseModel = new ExerciseModel();
