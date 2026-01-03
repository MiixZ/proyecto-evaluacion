import { SubmissionRow } from '@models/submission/submission.row';
import {
  SubmissionEntity,
  SubmissionTestResultEntity,
  SubmissionDTO,
  SubmissionTestResultDTO,
} from '@models/submission/submission.entity';

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

  toEntity(row: SubmissionRow): SubmissionEntity {
    return {
      id: row.id,
      exerciseId: row.exercise_id,
      studentId: row.student_id,
      courseId: row.course_id,
      attemptNumber: row.attempt_number,
      code: row.code,
      language: row.language,
      status: row.status,
      verdict: row.verdict,
      score: row.score,
      isLate: !!row.is_late,
      usedHint: !!row.used_hint,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as SubmissionEntity;
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
      hintText: entity.hintText || null,
    };
  }
}

export const submissionMapper = new SubmissionMapper();
