import { v4 as uuidv4 } from 'uuid';
import { exerciseModel } from '@models/exercise/exercise.model';
import {
  ExerciseDTO,
  ExerciseStudentDTO,
} from '@models/exercise/exercise.entity';
import { CreateExerciseInput } from '@validators/exercise.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { exerciseMapper } from '@mappers/exercise.mapper';
import { NotFoundError } from '@utils/errors';
import { syllabusModel } from '@models/syllabus/syllabus.model';
import { auditService } from '@services/audit/audit.service';

export class ExerciseService {
  async createExercise(
    input: CreateExerciseInput,
    teacherId: UUID
  ): Promise<ExerciseDTO> {
    const exists = await syllabusModel.exists(input.syllabusId as UUID);

    if (!exists) {
      throw new NotFoundError('El temario (Syllabus) especificado no existe');
    }

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
  ): Promise<ExerciseDTO | ExerciseStudentDTO> {
    const exercise = await exerciseModel.getById(id);

    if (isStudent) {
      if (!exercise.isPublished) {
        throw new NotFoundError('Ejercicio no encontrado o no disponible');
      }

      return exerciseMapper.toStudentDTO(exercise);
    }

    return exerciseMapper.toDTO(exercise);
  }

  async listExercisesBySyllabus(
    syllabusId: UUID,
    page: number,
    limit: number,
    isStudent: boolean
  ): Promise<PaginatedResponse<ExerciseDTO | ExerciseStudentDTO>> {
    const exists = await syllabusModel.exists(syllabusId);

    if (!exists) {
      throw new NotFoundError('El temario (Syllabus) especificado no existe');
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
}

export const exerciseService = new ExerciseService();
