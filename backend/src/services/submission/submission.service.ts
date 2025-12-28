import { v4 as uuidv4 } from 'uuid';
import { submissionModel } from '@models/submission/submission.model';
import { exerciseModel } from '@models/exercise/exercise.model';
import { ExecutionEngineClient } from '@services/shared/executionEngineClient.service';
import { CreateSubmissionInput } from '@validators/schemas';
import {
  UUID,
  SubmissionVerdict,
  EfficiencyOrder,
} from '@CustomTypes/common.types';
import {
  ExecutionRequest,
  ExecutionResult,
  Veredict,
} from '@CustomTypes/submission.types';
import { ValidationError } from '@utils/errors';
import { logger } from '@utils/logger';
import { SubmissionTestResultEntity } from '@models/submission/submission.entity';

export class SubmissionService {
  private executionClient: ExecutionEngineClient;

  constructor() {
    this.executionClient = new ExecutionEngineClient();
  }

  async processSubmission(
    userId: UUID,
    input: CreateSubmissionInput & { courseId: UUID }
  ) {
    const exercise = await exerciseModel.getById(input.exerciseId as UUID);

    if (!exercise.isPublished) {
      throw new ValidationError('El ejercicio no está disponible.');
    }

    const testCases = await exerciseModel.getTestCases(exercise.id);
    const limits = await exerciseModel.getExecutionLimits(
      exercise.id,
      input.language
    );

    const executionLimits = {
      timeLimitSeconds: limits?.timeLimitSeconds ?? 5,
      memoryLimitMb: limits?.memoryLimitMb ?? 256,
    };

    const submissionId = uuidv4() as UUID;
    const attemptNumber = await submissionModel.getNextAttemptNumber(
      userId as UUID,
      exercise.id
    );

    const now = new Date();
    const isLate = exercise.deadline ? now > exercise.deadline : false;

    await submissionModel.create({
      id: submissionId,
      exerciseId: exercise.id,
      studentId: userId as UUID,
      courseId: input.courseId as UUID,
      code: input.code,
      language: input.language,
      attemptNumber,
      isLate,
    });

    const execRequest: ExecutionRequest = {
      id: uuidv4(),
      submissionId,
      exerciseId: exercise.id,
      code: input.code,
      language: input.language,
      testCases: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        timeLimit: tc.timeLimitSeconds,
        memoryLimit: tc.memoryLimitMb,
        isHidden: tc.isHidden,
      })),
      limits: executionLimits,
      createdAt: new Date(),
    };

    let execResult: ExecutionResult;
    try {
      execResult = await this.executionClient.executeCode(execRequest);
    } catch (error) {
      logger.error('Fallo en Execution Engine', error);

      await submissionModel.updateResult(
        submissionId,
        SubmissionVerdict.RUNTIME_ERROR,
        0,
        []
      );

      throw error;
    }

    let finalScore = execResult.score;

    if (isLate && exercise.lateSubmissionPenaltyPercent > 0) {
      const penalty =
        (finalScore * exercise.lateSubmissionPenaltyPercent) / 100;
      finalScore = Math.max(0, finalScore - penalty);
    }

    const submissionTestResults: SubmissionTestResultEntity[] =
      execResult.testResults.map((tr) => ({
        id: uuidv4() as UUID,
        submissionId,
        testCaseId: tr.testCaseId as UUID,
        status: tr.status === 'passed' ? 'passed' : 'failed',
        actualOutput: tr.actualOutput,
        executionTimeMs: tr.executionTime,
        memoryUsedMb: tr.memoryUsed,
        efficiencyAchieved: EfficiencyOrder.ANY, // TODO: Calcular basado en tiempo vs esperado
      }));

    const finalVerdict = this.mapEngineVerdict(execResult.verdict);

    await submissionModel.updateResult(
      submissionId,
      finalVerdict,
      finalScore,
      submissionTestResults
    );

    return {
      submissionId,
      verdict: finalVerdict,
      score: finalScore,
    };
  }

  private mapEngineVerdict(engineVerdict: Veredict): SubmissionVerdict {
    const map: Record<Veredict, SubmissionVerdict> = {
      [Veredict.ACCEPTED]: SubmissionVerdict.ACCEPTED,
      [Veredict.WRONG_ANSWER]: SubmissionVerdict.WRONG_ANSWER,
      [Veredict.COMPILATION_ERROR]: SubmissionVerdict.COMPILATION_ERROR,
      [Veredict.RUNTIME_ERROR]: SubmissionVerdict.RUNTIME_ERROR,
      [Veredict.TIME_LIMIT_EXCEEDED]: SubmissionVerdict.TIME_LIMIT,
      [Veredict.MEMORY_LIMIT_EXCEEDED]: SubmissionVerdict.MEMORY_LIMIT,
      [Veredict.SYSTEM_ERROR]: SubmissionVerdict.RUNTIME_ERROR,
    };

    return map[engineVerdict] || SubmissionVerdict.RUNTIME_ERROR;
  }
}

export const submissionService = new SubmissionService();
