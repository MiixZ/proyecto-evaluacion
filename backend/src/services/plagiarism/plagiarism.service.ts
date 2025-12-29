import { plagiarismModel } from '@models/plagiarism/plagiarism.model';
import {
  CreatePlagiarismCheckInput,
  ReviewPlagiarismInput,
} from '@validators/plagiarism.validator';
import { UUID, PlagiarismType } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import stringSimilarity from 'string-similarity';
import { auditService } from '@services/audit/audit.service';

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
    const updatedCheck = await plagiarismModel.updateReview(
      id as UUID,
      input,
      reviewerId
    );

    await auditService.log(
      'REVIEW_PLAGIARISM',
      'plagiarism_check',
      updatedCheck.id,
      { isFlagged: input.isFlagged, notes: input.notes },
      reviewerId
    );

    return updatedCheck;
  }

  async listChecks(
    page: number,
    limit: number,
    filters: { isFlagged?: boolean; type?: PlagiarismType }
  ) {
    return await plagiarismModel.list(page, limit, filters);
  }

  async runBasicComparison(
    submissionId: UUID,
    targetSubmissionId: UUID
  ): Promise<number> {
    const source = await submissionModel.getById(submissionId);
    const target = await submissionModel.getById(targetSubmissionId);

    const similarityScore = this.calculateSimilarity(source.code, target.code);
    const similarityPercent = Math.round(similarityScore * 100);

    const SIMILARITY_THRESHOLD = 80;
    const isFlagged = similarityPercent >= SIMILARITY_THRESHOLD;

    const check = await this.createCheck({
      submissionId,
      comparedWithSubmissionId: targetSubmissionId,
      similarityPercent: similarityPercent,
      plagiarismType: PlagiarismType.INTERNAL,
      isFlagged,
      toolUsed: 'String Similarity (Dice Coefficient)',
      notes: isFlagged
        ? `Alta similitud textual detectada (${similarityPercent}%). Revisión manual recomendada.`
        : undefined,
    });

    if (isFlagged) {
      await auditService.log(
        'PLAGIARISM_FLAGGED',
        'plagiarism_check',
        check.id,
        {
          similarity: similarityPercent,
          source: submissionId,
          target: targetSubmissionId,
        },
        undefined
      );
    }

    return similarityPercent;
  }

  private calculateSimilarity(code1: string, code2: string): number {
    const clean1 = this.normalizeCode(code1);
    const clean2 = this.normalizeCode(code2);

    if (!clean1 || !clean2) return 0;
    if (clean1 === clean2) return 1;

    return stringSimilarity.compareTwoStrings(clean1, clean2);
  }

  private normalizeCode(code: string): string {
    return code.replace(/\s+/g, ' ').trim();
  }
}

export const plagiarismService = new PlagiarismService();
