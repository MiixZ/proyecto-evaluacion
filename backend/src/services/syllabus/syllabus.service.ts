import { syllabusModel } from '@models/syllabus/syllabus.model';
import { CreateSyllabusInput } from '@validators/syllabus.validator';
import { UUID } from '@CustomTypes/common.types';
import { courseModel } from '@models/course/course.model';
import { NotFoundError } from '@utils/errors';

export class SyllabusService {
  async createSyllabus(input: CreateSyllabusInput) {
    const courseExists = await courseModel.exists(input.courseId as UUID);

    if (!courseExists) {
      throw new NotFoundError('El curso especificado no existe');
    }

    return await syllabusModel.create(input);
  }

  async getByCourse(courseId: string) {
    return await syllabusModel.listByCourse(courseId as UUID);
  }
}

export const syllabusService = new SyllabusService();
