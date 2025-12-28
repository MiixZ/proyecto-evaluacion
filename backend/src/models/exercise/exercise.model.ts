import { ResultSetHeader } from 'mysql2/promise';
import { getPool } from '@config/database';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { ExerciseEntity } from './exercise.entity';
import { TestCaseEntity, ExecutionLimitEntity } from './exercise.types';
import { ExerciseRow, TestCaseRow, ExecutionLimitRow } from './exercise.row';
import { exerciseMapper } from '@mappers/exercise.mapper';
import { NotFoundError } from '@utils/errors';
import { CreateExerciseInput } from '@validators/exercise.validator';

export class ExerciseModel {
  async create(
    input: CreateExerciseInput,
    createdById: UUID
  ): Promise<ExerciseEntity> {
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
      false,
      createdById,
      input.orderIndex || null,
      input.points,
      input.efficiencyOrder,
      input.deadline || null,
      input.lateSubmissionPenaltyPercent,
      input.maxAttempts,
    ];

    const [result] = await getPool().execute<ResultSetHeader>(query, values);

    // TODO: Recuperamos el ID generado (si usamos UUID() de MySQL, necesitamos recuperarlo o generarlo en JS)
    // NOTA: Tu query usa UUID() de MySQL. Para recuperar ese UUID insertado necesitamos hacer una select
    // o generarlo en la aplicación (recomendado). Asumiremos generación en app para consistencia:

    // *CORRECCIÓN*: Generemos el UUID en la app para evitar round-trips extra.
    // (Ver implementación en Service, aquí asumiremos que pasamos el ID o cambiamos la query abajo)

    // Si mantenemos UUID() de MySQL, no podemos devolver el ID fácilmente sin select last_insert_id si fuera auto_inc.
    // Vamos a asumir que el modelo recibe el ID o lo cambiamos para que haga SELECT.
    // Para simplificar y consistencia con submission, haremos SELECT by syllabus ordenado desc limit 1 por ahora,
    // o mejor, refactorizaremos para generar UUID en el servicio (paso 4).

    // Por ahora, asumamos que funciona y busquemos el último insertado (no ideal) o devolvemos void.
    // Lo ideal: Cambiar la query para recibir el UUID desde el servicio.

    throw new Error('Refactor needed: Generate UUID in service layer');
  }

  async createWithId(
    id: UUID,
    input: CreateExerciseInput,
    createdById: UUID
  ): Promise<ExerciseEntity> {
    const query = `
      INSERT INTO exercises (
        id, syllabus_id, title, description, difficulty, language,
        template_code, is_published, created_by, order_index, points,
        efficiency_order, deadline, late_submission_penalty_percent, max_attempts,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      id,
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

    await getPool().execute(query, values);
    return this.getById(id);
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
    let where = 'syllabus_id = ?';
    const params: any[] = [syllabusId];

    if (onlyPublished) {
      where += ' AND is_published = 1';
    }

    // Count
    const countQuery = `SELECT COUNT(*) as total FROM exercises WHERE ${where}`;
    const [countRows] = await getPool().execute<any[]>(countQuery, params);
    const total = countRows[0].total;

    // Data
    const query = `
      SELECT * FROM exercises 
      WHERE ${where} 
      ORDER BY order_index ASC, created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await getPool().execute<ExerciseRow[]>(query, [
      ...params,
      limit.toString(),
      offset.toString(),
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
