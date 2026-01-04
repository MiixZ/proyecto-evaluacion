import { v4 as uuidv4 } from 'uuid';
import { exerciseModel } from '@models/exercise/exercise.model';
import {
  ExerciseDTO,
  ExerciseStudentDTO,
} from '@models/exercise/exercise.entity';
import { CreateExerciseInput } from '@validators/exercise.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { exerciseMapper } from '@mappers/exercise.mapper';
import { AppError, NotFoundError } from '@utils/errors';
import { syllabusModel } from '@models/syllabus/syllabus.model';
import { auditService } from '@services/audit/audit.service';
import { languageService } from '@services/language/language.service';
import { getPool } from '@config/database';

interface ExerciseDetailDTO extends ExerciseDTO {
  testCases?: Array<{
    id: UUID;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    timeLimitSeconds: number;
    memoryLimitMb: number;
    hintText: string;
    hintPenaltyPercent: number;
  }>;
  limits?: {
    timeLimitSeconds: number;
    memoryLimitMb: number;
  };
  courseId?: UUID;
}

export class ExerciseService {
  async createExercise(
    input: CreateExerciseInput,
    teacherId: UUID
  ): Promise<ExerciseDTO> {
    const exists = await syllabusModel.exists(input.syllabusId as UUID);

    if (!exists) {
      throw new NotFoundError('Temario (Syllabus) con id: ' + input.syllabusId);
    }

    await languageService.validateLanguageSupport(input.language);

    const newExerciseId = uuidv4() as UUID;

    const exercise = await exerciseModel.createTransactional(
      newExerciseId,
      input,
      teacherId
    );

    await auditService.log(
      'CREATE_EXERCISE',
      'exercise',
      exercise.id,
      { title: exercise.title, syllabusId: exercise.syllabusId },
      teacherId
    );

    return exerciseMapper.toDTO(exercise);
  }

  async getExerciseById(
    id: UUID,
    isStudent: boolean = false
  ): Promise<ExerciseDTO | ExerciseStudentDTO | ExerciseDetailDTO> {
    const exercise = await exerciseModel.getById(id);

    if (isStudent) {
      if (!exercise.isPublished) {
        throw new NotFoundError('Ejercicio con id: ' + id);
      }

      return exerciseMapper.toStudentDTO(exercise);
    }

    const testCases = await exerciseModel.getTestCases(id);
    const limits = await exerciseModel.getExecutionLimits(
      id,
      exercise.language
    );

    const dto = exerciseMapper.toDTO(exercise);

    const detailDto: ExerciseDetailDTO = {
      ...dto,
      testCases: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        timeLimitSeconds: tc.timeLimitSeconds,
        memoryLimitMb: tc.memoryLimitMb,
        hintText: tc.hintText || '',
        hintPenaltyPercent: tc.hintPenaltyPercent || 0,
      })),
      limits: limits
        ? {
            timeLimitSeconds: limits.timeLimitSeconds,
            memoryLimitMb: limits.memoryLimitMb,
          }
        : undefined,
      courseId: exercise.courseId,
    };

    return detailDto;
  }

  async listExercisesBySyllabus(
    syllabusId: UUID,
    page: number,
    limit: number,
    isStudent: boolean
  ): Promise<PaginatedResponse<ExerciseDTO | ExerciseStudentDTO>> {
    const exists = await syllabusModel.exists(syllabusId);

    if (!exists) {
      throw new NotFoundError('Temario (Syllabus) con id: ' + syllabusId);
    }

    const result = await exerciseModel.listBySyllabus(
      syllabusId,
      page,
      limit,
      isStudent
    );

    const dtos = result.items.map((entity) =>
      isStudent
        ? exerciseMapper.toStudentDTO(entity)
        : exerciseMapper.toDTO(entity)
    );

    return {
      ...result,
      items: dtos,
    };
  }

  async publishExercise(id: UUID): Promise<ExerciseDTO> {
    const exercise = await exerciseModel.setPublishedStatus(id, true);

    await auditService.log(
      'PUBLISH_EXERCISE',
      'exercise',
      id,
      { isPublished: true },
      exercise.createdBy
    );

    return exerciseMapper.toDTO(exercise);
  }

  async unpublishExercise(id: UUID): Promise<ExerciseDTO> {
    const exercise = await exerciseModel.setPublishedStatus(id, false);

    await auditService.log(
      'UNPUBLISH_EXERCISE',
      'exercise',
      id,
      { isPublished: false },
      exercise.createdBy
    );

    return exerciseMapper.toDTO(exercise);
  }

  async getProfessorExercises(teacherId: UUID) {
    const exercises = await exerciseModel.findByProfessor(teacherId);

    return exercises.map((ex: any) => ({
      id: ex.id,
      title: ex.title,
      subject: `${ex.subject_name} (${ex.academic_year})`,
      syllabus: ex.syllabus_title,
      difficulty: ex.difficulty,
      isPublished: Boolean(ex.is_published),
      submissionCount: ex.submission_count,
      createdAt: ex.created_at,
    }));
  }

  async togglePublishStatus(exerciseId: UUID, status: boolean) {
    await exerciseModel.getById(exerciseId);
    await exerciseModel.updateField(exerciseId, 'is_published', status);

    await auditService.log(
      status ? 'PUBLISH_EXERCISE' : 'UNPUBLISH_EXERCISE',
      'exercise',
      exerciseId,
      { isPublished: status },
      exerciseId
    );

    return { success: true, isPublished: status };
  }

  async cloneExercise(exerciseId: UUID, teacherId: UUID) {
    const connection = await getPool().getConnection();
    await connection.beginTransaction();

    try {
      const [originalEx]: any[] = await connection.execute(
        `SELECT 
          id, syllabus_id, title, description, difficulty, language, 
          template_code, points, max_attempts, late_submission_penalty_percent, 
          deadline 
         FROM exercises WHERE id = ?`,
        [exerciseId]
      );

      if (!originalEx[0]) throw new NotFoundError('Ejercicio no encontrado');
      const source = originalEx[0];

      const newId = uuidv4() as UUID;
      const newTitle = `Copia de ${source.title}`;

      const templateCode =
        source.template_code !== undefined ? source.template_code : null;

      await connection.execute(
        `
        INSERT INTO exercises (
          id, syllabus_id, title, description, difficulty, language, 
          template_code, points, max_attempts, late_submission_penalty_percent, 
          deadline, is_published, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, NOW(), NOW())
      `,
        [
          newId,
          source.syllabus_id,
          newTitle,
          source.description,
          source.difficulty,
          source.language,
          templateCode,
          source.points,
          source.max_attempts,
          source.late_submission_penalty_percent,
          source.deadline,
          teacherId,
        ]
      );

      const [testCases]: any[] = await connection.execute(
        'SELECT * FROM test_cases WHERE exercise_id = ?',
        [exerciseId]
      );

      for (const tc of testCases) {
        const newTcId = uuidv4();
        await connection.execute(
          `
          INSERT INTO test_cases (
            id, exercise_id, input, expected_output, is_hidden, 
            order_index, time_limit_seconds, memory_limit_mb, 
            hint_text, hint_penalty_percent, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
          [
            newTcId,
            newId,
            tc.input,
            tc.expected_output,
            tc.is_hidden,
            tc.order_index,
            tc.time_limit_seconds,
            tc.memory_limit_mb,
            tc.hint_text,
            tc.hint_penalty_percent,
          ]
        );
      }

      const [limits]: any[] = await connection.execute(
        'SELECT * FROM execution_limits WHERE exercise_id = ?',
        [exerciseId]
      );

      for (const lim of limits) {
        const newLimId = uuidv4();
        await connection.execute(
          `
          INSERT INTO execution_limits (
            id, exercise_id, language, time_limit_seconds, memory_limit_mb
          ) VALUES (?, ?, ?, ?, ?)
        `,
          [
            newLimId,
            newId,
            lim.language,
            lim.time_limit_seconds,
            lim.memory_limit_mb,
          ]
        );
      }

      await connection.commit();

      await auditService.log(
        'CLONE_EXERCISE',
        'exercise',
        newId,
        { originalId: exerciseId, title: newTitle },
        teacherId
      );

      return { id: newId, title: newTitle };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteExercise(id: UUID, teacherId: UUID) {
    const exercise = await exerciseModel.getById(id);

    if (exercise.createdBy !== teacherId) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No tienes permiso para eliminar este ejercicio'
      );
    }

    const connection = await getPool().getConnection();

    try {
      const [submissions]: any[] = await connection.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE exercise_id = ?',
        [id]
      );

      const submissionCount = submissions[0]?.count || 0;

      if (submissionCount > 0) {
        throw new AppError(
          'CONFLICT',
          409,
          'No se puede eliminar un ejercicio que ya tiene entregas de alumnos. Prueba a despublicarlo.'
        );
      }

      await exerciseModel.delete(id);

      await auditService.log(
        'DELETE_EXERCISE',
        'exercise',
        id,
        { title: exercise.title },
        teacherId
      );

      return { success: true };
    } finally {
      connection.release();
    }
  }

  async updateExercise(
    id: UUID,
    input: CreateExerciseInput,
    teacherId: UUID
  ): Promise<ExerciseDTO> {
    const exercise = await exerciseModel.getById(id);

    if (exercise.createdBy !== teacherId) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No tienes permiso para editar este ejercicio'
      );
    }

    await languageService.validateLanguageSupport(input.language);

    const updatedExercise = await exerciseModel.updateTransactional(id, input);

    await auditService.log(
      'UPDATE_EXERCISE',
      'exercise',
      id,
      { title: input.title, syllabusId: input.syllabusId },
      teacherId
    );

    return exerciseMapper.toDTO(updatedExercise);
  }
}

export const exerciseService = new ExerciseService();
