import { subjectModel } from '@models/subject/subject.model';
import {
  CreateSubjectInput,
  UpdateSubjectInput,
} from '@validators/subject.validator';
import { UUID } from '@CustomTypes/common.types';
// TODO: Importar degreeModel cuando se cree el módulo Degree

export class SubjectService {
  async createSubject(input: CreateSubjectInput) {
    // TODO: Validar input.degreeId con degreeModel.exists(input.degreeId)
    return await subjectModel.create(input);
  }

  async getSubjectById(id: string) {
    return await subjectModel.getById(id as UUID);
  }

  async updateSubject(id: string, input: UpdateSubjectInput) {
    await subjectModel.getById(id as UUID);

    return await subjectModel.update(id as UUID, input);
  }

  async listSubjects(
    page: number,
    limit: number,
    filters: { degreeId?: string; status?: string }
  ) {
    return await subjectModel.list(page, limit, filters);
  }
}

export const subjectService = new SubjectService();
