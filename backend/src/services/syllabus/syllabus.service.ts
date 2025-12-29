import { syllabusModel } from '@models/syllabus/syllabus.model';
import { CreateSyllabusInput } from '@validators/syllabus.validator';
import { UUID } from '@CustomTypes/common.types';
// import { courseModel } from '@models/course/course.model'; // Necesitarás validar que el curso existe

export class SyllabusService {
  async createSyllabus(input: CreateSyllabusInput) {
    // TODO: Validar que input.courseId existe usando courseModel.exists(input.courseId)
    return await syllabusModel.create(input);
  }

  async getByCourse(courseId: string) {
    return await syllabusModel.listByCourse(courseId as UUID);
  }
}

export const syllabusService = new SyllabusService();
