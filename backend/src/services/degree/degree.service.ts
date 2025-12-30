import { degreeModel } from '@models/degree/degree.model';
import {
  CreateDegreeInput,
  UpdateDegreeInput,
} from '@validators/degree.validator';
import { UUID } from '@CustomTypes/common.types';

export class DegreeService {
  async createDegree(input: CreateDegreeInput) {
    return await degreeModel.create(input);
  }

  async getDegreeById(id: string) {
    return await degreeModel.getById(id as UUID);
  }

  async updateDegree(id: string, input: UpdateDegreeInput) {
    await degreeModel.getById(id as UUID); // Validar existencia
    return await degreeModel.update(id as UUID, input);
  }

  async listDegrees(
    page: number,
    limit: number,
    filters: { status?: string; search?: string }
  ) {
    return await degreeModel.list(page, limit, filters);
  }
}

export const degreeService = new DegreeService();
