import { v4 as uuidv4 } from 'uuid';
import { exerciseModel } from '@models/exercise/exercise.model';
import {
  ExerciseDTO,
  ExerciseStudentDTO,
} from '@models/exercise/exercise.entity';
import { CreateExerciseInput } from '@validators/exercise.validator';
import { UUID, PaginatedResponse } from '@CustomTypes/common.types';
import { exerciseMapper } from '@mappers/exercise.mapper';

export class ExerciseService {
  async createExercise(
    input: CreateExerciseInput,
    teacherId: UUID
  ): Promise<ExerciseDTO> {
    const newId = uuidv4() as UUID;

    // TODO: Aquí se podría validar si el syllabus existe o si el profesor tiene acceso al curso, etc.

    const exercise = await exerciseModel.createWithId(newId, input, teacherId);

    return exerciseMapper.toDTO(exercise);
  }

  async getExerciseById(
    id: UUID,
    isStudent: boolean = false
  ): Promise<ExerciseDTO | ExerciseStudentDTO> {
    const exercise = await exerciseModel.getById(id);

    if (isStudent) {
      if (!exercise.isPublished) {
        throw new Error('El ejercicio no está disponible');
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
    const onlyPublished = isStudent;

    const result = await exerciseModel.listBySyllabus(
      syllabusId,
      page,
      limit,
      onlyPublished
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
