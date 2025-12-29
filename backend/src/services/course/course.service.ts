import { courseModel } from '@models/course/course.model';
import {
  CreateCourseInput,
  UpdateCourseInput,
} from '@validators/course.validator';
import { UUID, CourseStatus } from '@CustomTypes/common.types';
import { subjectModel } from '@models/subject/subject.model';
import { NotFoundError } from '@utils/errors';

export class CourseService {
  async createCourse(input: CreateCourseInput) {
    const subjectExists = await subjectModel.exists(input.subjectId as UUID);

    if (!subjectExists) {
      throw new NotFoundError('La asignatura especificada no existe');
    }

    return await courseModel.create(input);
  }

  async getCourseById(id: string) {
    return await courseModel.getById(id as UUID);
  }

  async updateCourse(id: string, input: UpdateCourseInput) {
    await courseModel.getById(id as UUID);

    return await courseModel.update(id as UUID, input);
  }

  async listCourses(
    page: number,
    limit: number,
    filters: { status?: CourseStatus; academicYear?: string }
  ) {
    return await courseModel.list(page, limit, filters);
  }
}

export const courseService = new CourseService();
