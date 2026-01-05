import { syllabusModel } from '@models/syllabus/syllabus.model';
import {
  CreateSyllabusInput,
  UpdateSyllabusInput,
} from '@validators/syllabus.validator';
import { UserRole, UUID } from '@CustomTypes/common.types';
import { courseModel } from '@models/course/course.model';
import { ForbiddenError, NotFoundError } from '@utils/errors';
import { groupModel } from '@models/group/group.model';

export class SyllabusService {
  async createSyllabus(input: CreateSyllabusInput) {
    const courseExists = await courseModel.exists(input.courseId as UUID);

    if (!courseExists) {
      throw new NotFoundError(
        'El curso especificado con id: ' + input.courseId
      );
    }

    return await syllabusModel.create(input);
  }

  async updateSyllabus(id: string, input: UpdateSyllabusInput) {
    return await syllabusModel.update(id as UUID, input);
  }

  async listSyllabi(
    page: number,
    limit: number,
    filters: { courseId?: string }
  ) {
    return await syllabusModel.list(page, limit, filters);
  }

  async getByCourse(courseId: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.STUDENT) {
      const isEnrolled = await groupModel.isUserEnrolledInCourse(
        userId as UUID,
        courseId as UUID
      );

      if (!isEnrolled) {
        throw new ForbiddenError('No estás matriculado en este curso');
      }
    }

    return await syllabusModel.listByCourse(courseId as UUID);
  }
}

export const syllabusService = new SyllabusService();
