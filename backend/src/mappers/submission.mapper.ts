import {
  SubmissionEntity,
  SubmissionDTO,
  SubmissionTestResultEntity,
  SubmissionTestResultDTO,
} from '@models/submission/submission.entity';
import {
  SubmissionRow,
  SubmissionTestResultRow,
} from '@models/submission/submission.row';
import { BaseMapper } from '@utils/mapper';
import {
  UUID,
  SubmissionStatus,
  SubmissionVerdict,
  EfficiencyOrder,
} from '@CustomTypes/common.types';

class SubmissionMapper extends BaseMapper<
  SubmissionEntity,
  SubmissionDTO,
  SubmissionRow
> {
  toEntity(row: SubmissionRow): SubmissionEntity {
    return {
      id: row.id as UUID,
      exerciseId: row.exercise_id as UUID,
      studentId: row.student_id as UUID,
      courseId: row.course_id as UUID,
      attemptNumber: row.attempt_number,
      code: row.code,
      language: row.language,
      status: row.status as SubmissionStatus,
      verdict: row.verdict as SubmissionVerdict,
      score: row.score,
      isLate: Boolean(row.is_late),
      usedHint: Boolean(row.used_hint),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: SubmissionEntity): SubmissionDTO {
    return {
      id: entity.id,
      exerciseId: entity.exerciseId,
      studentId: entity.studentId,
      courseId: entity.courseId,
      attemptNumber: entity.attemptNumber,
      code: entity.code,
      language: entity.language,
      status: entity.status,
      verdict: entity.verdict,
      score: entity.score,
      isLate: entity.isLate,
      usedHint: entity.usedHint,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      testResults: entity.testResults
        ? this.toTestResultDTOList(entity.testResults)
        : undefined,
    };
  }

  toTestResultEntity(row: SubmissionTestResultRow): SubmissionTestResultEntity {
    return {
      id: row.id as UUID,
      submissionId: row.submission_id as UUID,
      testCaseId: row.test_case_id as UUID,
      status: row.status,
      actualOutput: row.actual_output,
      errorId: row.error_id ? (row.error_id as UUID) : null,
      executionTimeMs: row.execution_time_ms || 0,
      memoryUsedMb: row.memory_used_mb || 0,
      efficiencyAchieved: row.efficiency_achieved as EfficiencyOrder,
      createdAt: new Date(row.created_at),
    };
  }

  toTestResultDTO(entity: SubmissionTestResultEntity): SubmissionTestResultDTO {
    return {
      id: entity.id,
      status: entity.status,
      executionTimeMs: entity.executionTimeMs,
      memoryUsedMb: entity.memoryUsedMb,
      actualOutput: entity.actualOutput,
    };
  }

  toTestResultDTOList(
    entities: SubmissionTestResultEntity[]
  ): SubmissionTestResultDTO[] {
    return entities.map((e) => this.toTestResultDTO(e));
  }
}

export const submissionMapper = new SubmissionMapper();
