import { BaseMapper } from '@utils/mapper';
import {
  ExerciseEntity,
  ExerciseDTO,
  ExerciseStudentDTO,
} from '@models/exercise/exercise.entity';
import {
  TestCaseEntity,
  ExecutionLimitEntity,
} from '@models/exercise/exercise.types';
import {
  ExerciseRow,
  TestCaseRow,
  ExecutionLimitRow,
} from '@models/exercise/exercise.row';
import {
  UUID,
  DifficultyLevel,
  EfficiencyOrder,
} from '@CustomTypes/common.types';

class ExerciseMapper extends BaseMapper<
  ExerciseEntity,
  ExerciseDTO,
  ExerciseRow
> {
  toEntity(row: ExerciseRow): ExerciseEntity {
    return {
      id: row.id as UUID,
      syllabusId: row.syllabus_id as UUID,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty as DifficultyLevel,
      language: row.language,
      templateCode: row.template_code,
      isPublished: Boolean(row.is_published),
      createdBy: row.created_by as UUID,
      orderIndex: row.order_index,
      points: row.points,
      efficiencyOrder: row.efficiency_order as EfficiencyOrder,
      deadline: row.deadline ? new Date(row.deadline) : null,
      lateDeadline: row.late_deadline ? new Date(row.late_deadline) : null,
      lateSubmissionPenaltyPercent: row.late_submission_penalty_percent,
      maxAttempts: row.max_attempts,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  toDTO(entity: ExerciseEntity): ExerciseDTO {
    return {
      id: entity.id,
      syllabusId: entity.syllabusId,
      title: entity.title,
      description: entity.description,
      difficulty: entity.difficulty,
      language: entity.language,
      isPublished: entity.isPublished,
      points: entity.points,
      maxAttempts: entity.maxAttempts,
      deadline: entity.deadline,
      lateDeadline: entity.lateDeadline,
    };
  }

  toStudentDTO(entity: ExerciseEntity): ExerciseStudentDTO {
    return {
      ...this.toDTO(entity),
      templateCode: entity.templateCode,
    };
  }

  toTestCaseEntity(row: TestCaseRow): TestCaseEntity {
    return {
      id: row.id as UUID,
      exerciseId: row.exercise_id as UUID,
      input: row.input,
      expectedOutput: row.expected_output,
      isHidden: Boolean(row.is_hidden),
      timeLimitSeconds: row.time_limit_seconds,
      memoryLimitMb: row.memory_limit_mb,
      hintText: row.hint_text,
      hintPenaltyPercent: row.hint_penalty_percent,
      availableFrom: row.available_from ? new Date(row.available_from) : null,
    };
  }

  toExecutionLimitEntity(row: ExecutionLimitRow): ExecutionLimitEntity {
    return {
      id: row.id as UUID,
      exerciseId: row.exercise_id as UUID,
      language: row.language,
      timeLimitSeconds: row.time_limit_seconds,
      memoryLimitMb: row.memory_limit_mb,
    };
  }
}

export const exerciseMapper = new ExerciseMapper();
