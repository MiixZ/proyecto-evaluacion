import { v4 as uuidv4 } from 'uuid';
import { submissionModel } from '@models/submission/submission.model';
import { exerciseModel } from '@models/exercise/exercise.model';
import { ExecutionEngineClient } from '@services/shared/execution.client.service';
import {
  UUID,
  SubmissionVerdict,
  EfficiencyOrder,
  UserRole,
} from '@CustomTypes/common.types';
import {
  ExecutionRequest,
  ExecutionResult,
  Veredict as EngineVerdict,
} from '@CustomTypes/submission.types';
import { ValidationError, ForbiddenError, NotFoundError } from '@utils/errors';
import { logger } from '@utils/logger';
import {
  SubmissionTestResultEntity,
  SubmissionDTO,
} from '@models/submission/submission.entity';
import { submissionMapper } from '@mappers/submission.mapper';
import { CreateSubmissionInput } from '@validators/submission.validator';
import { auditService } from '@services/audit/audit.service';
import { languageService } from '@services/language/language.service';
import { submissionErrorService } from '@services/catalog/submission-error.service';

export class SubmissionService {
  private executionClient: ExecutionEngineClient;

  constructor() {
    this.executionClient = new ExecutionEngineClient();
  }

  async getStudentHistory(userId: UUID, exerciseId?: UUID): Promise<any[]> {
    if (exerciseId) {
      return await submissionModel.findByUserAndExercise(userId, exerciseId);
    } else {
      return await submissionModel.findAllByUser(userId);
    }
  }

  async getSubmissionById(
    submissionId: UUID,
    userId: UUID,
    userRole: UserRole
  ) {
    const submission = await submissionModel.getDetailsById(submissionId);

    if (!submission) {
      throw new NotFoundError('Entrega no encontrada');
    }

    if (userRole === UserRole.STUDENT && submission.student.id !== userId) {
      throw new ForbiddenError('No tienes permiso para ver esta entrega');
    }

    return submission;
  }
  // --------------------

  async processSubmission(
    userId: UUID,
    input: CreateSubmissionInput & { courseId: UUID }
  ): Promise<SubmissionDTO> {
    const exercise = await exerciseModel.getById(input.exerciseId as UUID);

    if (!exercise.isPublished) {
      throw new ValidationError('El ejercicio no está disponible o no existe.');
    }

    if (exercise.maxAttempts > 0) {
      const attemptsCount = await submissionModel.countAttempts(
        userId,
        exercise.id
      );
      if (attemptsCount >= exercise.maxAttempts) {
        throw new ForbiddenError(
          `Has alcanzado el número máximo de intentos permitidos (${exercise.maxAttempts}) para este ejercicio.`
        );
      }
    }

    if (exercise.language !== input.language) {
      throw new ValidationError(
        `Este ejercicio espera soluciones en ${exercise.language}, pero recibiste ${input.language}`
      );
    }

    await languageService.validateLanguageSupport(input.language);

    const testCases = await exerciseModel.getTestCases(exercise.id);

    if (!testCases || testCases.length === 0) {
      throw new ValidationError(
        'Este ejercicio no tiene casos de prueba configurados. Contacta con el profesor.'
      );
    }

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
      userId,
      exercise.id
    );
    const now = new Date();
    const isLate = exercise.deadline ? now > exercise.deadline : false;

    await submissionModel.create({
      id: submissionId,
      exerciseId: exercise.id,
      studentId: userId,
      courseId: input.courseId,
      code: input.code,
      language: input.language,
      attemptNumber,
      isLate,
      status: 'pending',
      verdict: SubmissionVerdict.PENDING,
      score: 0,
      usedHint: false,
      createdAt: now,
      updatedAt: now,
      constructor: { name: 'RowDataPacket' },
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
      logger.error('Fallo crítico en Execution Engine', error);

      await submissionModel.updateResult(
        submissionId,
        SubmissionVerdict.RUNTIME_ERROR,
        0,
        []
      );

      throw new Error('Error interno al comunicar con el motor de ejecución.');
    }

    let finalScore = execResult.score;

    if (isLate && exercise.lateSubmissionPenaltyPercent > 0) {
      const penalty =
        (finalScore * exercise.lateSubmissionPenaltyPercent) / 100;
      finalScore = Math.max(0, finalScore - penalty);
    }

    const submissionTestResults: SubmissionTestResultEntity[] =
      await Promise.all(
        execResult.testResults.map(async (tr) => {
          const limitTime = executionLimits.timeLimitSeconds;
          const limitMem = executionLimits.memoryLimitMb;

          let errorId: UUID | null = null;

          if (tr.status === 'timeout') {
            errorId = await submissionErrorService.getErrorIdByType('timeout');
          } else if (tr.status === 'error') {
            errorId =
              await submissionErrorService.getErrorIdByType('runtime_error');
          } else if (tr.status !== 'passed' && tr.status !== 'failed') {
            errorId =
              await submissionErrorService.getErrorIdByType('system_error');
          }

          return {
            id: uuidv4() as UUID,
            submissionId,
            testCaseId: tr.testCaseId as UUID,
            status: tr.status,
            actualOutput: tr.actualOutput,
            errorId,
            executionTimeMs: tr.executionTime,
            memoryUsedMb: tr.memoryUsed,
            efficiencyAchieved: this.calculateEfficiency(
              tr.executionTime,
              limitTime,
              tr.memoryUsed,
              limitMem
            ),
          };
        })
      );

    const finalVerdict = this.mapEngineVerdict(execResult.verdict);

    const updatedEntity = await submissionModel.updateResult(
      submissionId,
      finalVerdict,
      finalScore,
      submissionTestResults
    );

    await auditService.log(
      'CREATE_SUBMISSION',
      'submission',
      submissionId,
      {
        exerciseId: exercise.id,
        verdict: finalVerdict,
        score: finalScore,
        attempt: attemptNumber,
      },
      userId
    );

    return submissionMapper.toDTO(updatedEntity);
  }

  private mapEngineVerdict(engineVerdict: EngineVerdict): SubmissionVerdict {
    const map: Record<EngineVerdict, SubmissionVerdict> = {
      [EngineVerdict.ACCEPTED]: SubmissionVerdict.ACCEPTED,
      [EngineVerdict.WRONG_ANSWER]: SubmissionVerdict.WRONG_ANSWER,
      [EngineVerdict.COMPILATION_ERROR]: SubmissionVerdict.COMPILATION_ERROR,
      [EngineVerdict.RUNTIME_ERROR]: SubmissionVerdict.RUNTIME_ERROR,
      [EngineVerdict.TIME_LIMIT_EXCEEDED]: SubmissionVerdict.TIME_LIMIT,
      [EngineVerdict.MEMORY_LIMIT_EXCEEDED]: SubmissionVerdict.MEMORY_LIMIT,
      [EngineVerdict.SYSTEM_ERROR]: SubmissionVerdict.RUNTIME_ERROR,
    };

    return map[engineVerdict] || SubmissionVerdict.RUNTIME_ERROR;
  }

  private calculateEfficiency(
    executionTime: number,
    timeLimit: number,
    memoryUsed: number,
    memoryLimit: number
  ): EfficiencyOrder {
    if (
      executionTime > timeLimit * 1000 ||
      memoryUsed > memoryLimit * 1024 * 1024
    ) {
      return EfficiencyOrder.ANY;
    }

    const timeRatio = executionTime / (timeLimit * 1000);

    if (timeRatio <= 0.3) return EfficiencyOrder.BEST;
    if (timeRatio <= 0.6) return EfficiencyOrder.GOOD;
    if (timeRatio <= 0.9) return EfficiencyOrder.ACCEPTABLE;

    return EfficiencyOrder.ANY;
  }
}

export const submissionService = new SubmissionService();
