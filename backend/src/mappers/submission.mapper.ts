import {
  SubmissionEntity,
  SubmissionTestResultEntity,
  SubmissionDTO,
  SubmissionTestResultDTO,
} from '../models/submission/submission.entity';

class SubmissionMapper {
  toDTO(
    submission: SubmissionEntity & {
      testResults?: SubmissionTestResultEntity[];
    }
  ): SubmissionDTO {
    return {
      id: submission.id,
      exerciseId: submission.exerciseId,
      studentId: submission.studentId,
      courseId: submission.courseId,
      attemptNumber: submission.attemptNumber,
      code: submission.code,
      language: submission.language,
      status: submission.status,
      verdict: submission.verdict,
      score: submission.score,
      isLate: Boolean(submission.isLate),
      createdAt: submission.createdAt.toISOString(),
      testResults: submission.testResults
        ? submission.testResults.map((tr) => this.toTestResultDTO(tr))
        : [],
    };
  }

  private toTestResultDTO(
    entity: SubmissionTestResultEntity
  ): SubmissionTestResultDTO {
    return {
      id: entity.id,
      testCaseId: entity.testCaseId,
      status: entity.status,
      actualOutput: entity.actualOutput,
      executionTimeMs: entity.executionTimeMs,
      memoryUsedMb: entity.memoryUsedMb,
      error: null,
    };
  }
}

export const submissionMapper = new SubmissionMapper();
