import { plagiarismModel } from '@models/plagiarism/plagiarism.model';
import {
  CreatePlagiarismCheckInput,
  ReviewPlagiarismInput,
} from '@validators/plagiarism.validator';
import { UUID, PlagiarismType } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';

export class PlagiarismService {
  async createCheck(input: CreatePlagiarismCheckInput) {
    await submissionModel.getById(input.submissionId as UUID);
    await submissionModel.getById(input.comparedWithSubmissionId as UUID);

    return await plagiarismModel.create(input);
  }

  async getById(id: string) {
    return await plagiarismModel.getById(id as UUID);
  }

  async getBySubmission(submissionId: string) {
    return await plagiarismModel.listBySubmission(submissionId as UUID);
  }

  async reviewCheck(
    id: string,
    input: ReviewPlagiarismInput,
    reviewerId: UUID
  ) {
    return await plagiarismModel.updateReview(id as UUID, input, reviewerId);
  }

  async listChecks(
    page: number,
    limit: number,
    filters: { isFlagged?: boolean; type?: PlagiarismType }
  ) {
    return await plagiarismModel.list(page, limit, filters);
  }

  // TODO: esto sería un Job en cola
  async runBasicComparison(
    submissionId: UUID,
    targetSubmissionId: UUID
  ): Promise<number> {
    const source = await submissionModel.getById(submissionId);
    const target = await submissionModel.getById(targetSubmissionId);

    const similarity = this.calculateMockSimilarity(source.code, target.code);

    await this.createCheck({
      submissionId,
      comparedWithSubmissionId: targetSubmissionId,
      similarityPercent: similarity,
      plagiarismType: PlagiarismType.INTERNAL,
      isFlagged: similarity > 80,
    });

    return similarity;
  }

  private calculateMockSimilarity(code1: string, code2: string): number {
    // TODO: Implementación real pendiente (usar librería 'string-similarity' o similar)
    if (code1 === code2) return 100;

    return Math.floor(Math.random() * 50);
  }
}

export const plagiarismService = new PlagiarismService();
