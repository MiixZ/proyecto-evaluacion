import { submissionErrorModel } from '@models/catalog/submission-error.model';
import { UUID } from '@CustomTypes/common.types';

export class SubmissionErrorService {
  private errorCache: Map<string, UUID> = new Map();

  async getActiveErrors() {
    return await submissionErrorModel.findAll();
  }

  async getErrorIdByType(type: string): Promise<UUID | null> {
    if (this.errorCache.has(type)) {
      return this.errorCache.get(type)!;
    }

    const errorEntity = await submissionErrorModel.findByType(type);

    if (errorEntity) {
      this.errorCache.set(type, errorEntity.id);
      return errorEntity.id;
    }

    return null;
  }
}

export const submissionErrorService = new SubmissionErrorService();
