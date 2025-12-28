import { v4 as uuidv4 } from 'uuid';
import { submissionModel } from '@models/submission/submission.model';
import { exerciseModel } from '@models/exercise/exercise.model';
import { ExecutionEngineClient } from '@services/shared/execution.client.service';
import {
  UUID,
  SubmissionVerdict,
  EfficiencyOrder,
} from '@CustomTypes/common.types';
import {
  ExecutionRequest,
  ExecutionResult,
  Veredict as EngineVerdict,
} from '@CustomTypes/submission.types';
import { ValidationError } from '@utils/errors';
import { logger } from '@utils/logger';
import { SubmissionTestResultEntity } from '@models/submission/submission.entity';
import { submissionMapper } from '@mappers/submission.mapper';
import { SubmissionDTO } from '@models/submission/submission.entity';
import { CreateSubmissionInput } from '@validators/submission.validator';

export class SubmissionService {
  private executionClient: ExecutionEngineClient;

  constructor() {
    this.executionClient = new ExecutionEngineClient();
  }

  /**
   * Procesa el envío de una solución
   */
  async processSubmission(
    userId: UUID,
    input: CreateSubmissionInput & { courseId: UUID }
  ): Promise<SubmissionDTO> {
    // Validar existencia y publicación del ejercicio
    const exercise = await exerciseModel.getById(input.exerciseId as UUID);

    if (!exercise.isPublished) {
      throw new ValidationError('El ejercicio no está disponible o no existe.');
    }

    // Obtener metadatos necesarios
    const testCases = await exerciseModel.getTestCases(exercise.id);
    const limits = await exerciseModel.getExecutionLimits(
      exercise.id,
      input.language
    );

    const executionLimits = {
      timeLimitSeconds: limits?.timeLimitSeconds ?? 5,
      memoryLimitMb: limits?.memoryLimitMb ?? 256,
    };

    // Preparar datos de la submission
    const submissionId = uuidv4() as UUID;
    const attemptNumber = await submissionModel.getNextAttemptNumber(
      userId,
      exercise.id
    );
    const now = new Date();
    const isLate = exercise.deadline ? now > exercise.deadline : false;

    // Crear submission inicial (Pending)
    await submissionModel.create({
      id: submissionId,
      exerciseId: exercise.id,
      studentId: userId,
      courseId: input.courseId,
      code: input.code,
      language: input.language,
      attemptNumber,
      isLate,
    });

    // Preparar Request para el Motor
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

    // Ejecutar código
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
      throw error;
    }

    // Calcular Score con penalizaciones
    let finalScore = execResult.score;

    if (isLate && exercise.lateSubmissionPenaltyPercent > 0) {
      const penalty =
        (finalScore * exercise.lateSubmissionPenaltyPercent) / 100;
      finalScore = Math.max(0, finalScore - penalty);
    }

    // 8. Mapear resultados de tests
    const submissionTestResults: SubmissionTestResultEntity[] =
      execResult.testResults.map((tr) => ({
        id: uuidv4() as UUID,
        submissionId,
        testCaseId: tr.testCaseId as UUID,
        status: tr.status,
        actualOutput: tr.actualOutput,
        executionTimeMs: tr.executionTime,
        memoryUsedMb: tr.memoryUsed,
        efficiencyAchieved: EfficiencyOrder.ANY, // TODO: Implementar lógica de eficiencia real
      }));

    const finalVerdict = this.mapEngineVerdict(execResult.verdict);

    const updatedEntity = await submissionModel.updateResult(
      submissionId,
      finalVerdict,
      finalScore,
      submissionTestResults
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
}

export const submissionService = new SubmissionService();
