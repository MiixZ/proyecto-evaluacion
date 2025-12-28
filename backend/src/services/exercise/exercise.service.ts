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
// TODO: Importar syllabusModel cuando esté creado
// import { syllabusModel } from '@models/syllabus/syllabus.model';

export class ExerciseService {
  async createExercise(
    input: CreateExerciseInput,
    teacherId: UUID
  ): Promise<ExerciseDTO> {
    // 1. Validar Syllabus (Resolviendo el TODO conceptual)
    /*
    const syllabus = await syllabusModel.exists(input.syllabusId);
    if (!syllabus) {
      throw new NotFoundError('El temario (Syllabus) especificado no existe');
    }
    */

    const newExerciseId = uuidv4() as UUID;

    const exercise = await exerciseModel.createTransactional(
      newExerciseId,
      input,
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
    // TODO: Validar existencia de syllabus

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

    return exerciseMapper.toDTO(exercise);
  }

  async unpublishExercise(id: UUID): Promise<ExerciseDTO> {
    const exercise = await exerciseModel.setPublishedStatus(id, false);

    return exerciseMapper.toDTO(exercise);
  }
}

export const exerciseService = new ExerciseService();
