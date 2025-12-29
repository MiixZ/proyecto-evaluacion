import { courseModel } from '@models/course/course.model';
import {
  CreateCourseInput,
  UpdateCourseInput,
} from '@validators/course.validator';
import { UUID, CourseStatus } from '@CustomTypes/common.types';

export class CourseService {
  async createCourse(input: CreateCourseInput) {
    // TODO: Validar que input.subjectId existe cuando creemos el módulo Subject
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
