import { v4 as uuidv4 } from 'uuid';
import { submissionModel } from '@models/submission/submission.model';
import { exerciseModel } from '@models/exercise/exercise.model';
import { ExecutionEngineClient } from '@services/shared/execution.client.service';
import {
  UUID,
  SubmissionVerdict,
  EfficiencyOrder,
  UserRole,
  PlagiarismType,
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
import { plagiarismService } from '@services/plagiarism/plagiarism.service';
import { commonFilesModel } from '@models/common-files/common-files.model';
import { hintUsageModel } from '@models/hint/hint-usage.model';

/**
 * Servicio para gestión de envíos de código y ejecución
 * Coordina la ejecución, evaluación y detección de plagio
 */
export class SubmissionService {
  private executionClient: ExecutionEngineClient;

  constructor() {
    this.executionClient = new ExecutionEngineClient();
  }

  /**
   * Obtiene el historial de envíos de un estudiante
   * @param userId - ID del estudiante
   * @param exerciseId - ID del ejercicio (opcional)
   * @returns Lista de envíos
   */
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

    // Si es estudiante, ocultar detalles de test cases privados
    if (userRole === UserRole.STUDENT && submission.testResults) {
      submission.testResults = submission.testResults.map((tr: any) => {
        if (tr.isHidden) {
          return {
            ...tr,
            input: undefined,
            expectedOutput: undefined,
          };
        }
        return tr;
      });
    }

    return submission;
  }
  /**
   * Procesa un envío de código completo:
   * - Valida intentos disponibles y permisos
   * - Ejecuta el código contra casos de prueba
   * - Calcula puntuación con penalizaciones
   * - Registra auditoría y dispara detección de plagio
   * @param userId - ID del estudiante
   * @param input - Datos del envío (código, lenguaje, ejercicio)
   * @returns DTO del envío procesado con resultados
   */
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

    const now = new Date();
    if (exercise.lateDeadline && now > exercise.lateDeadline) {
      throw new ForbiddenError(
        'El plazo de entrega tardía ha expirado. No se admiten más envíos.'
      );
    }

    if (exercise.language !== input.language) {
      throw new ValidationError(
        `Este ejercicio espera soluciones en ${exercise.language}, pero recibiste ${input.language}`
      );
    }

    await languageService.validateLanguageSupport(input.language);

    const allTestCases = await exerciseModel.getTestCases(exercise.id);
    const testCases = allTestCases.filter(
      (tc) => !tc.availableFrom || now >= tc.availableFrom
    );

    if (!testCases || testCases.length === 0) {
      throw new ValidationError(
        'Este ejercicio no tiene casos de prueba disponibles actualmente.'
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
    // now declarada previamente para validar lateDeadline
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
      archived: false,
    });

    this.checkBehavioralAnomaly(userId, exercise.id, submissionId).catch(
      (err) => logger.error('Error en chequeo de anomalía', err)
    );

    this.triggerPlagiarismCheck(submissionId, exercise.id, userId).catch(
      (err) => logger.error('Error en chequeo automático de plagio', err)
    );

    // Fetch common files for exercise and syllabus
    const exerciseFiles = await commonFilesModel.getExerciseFiles(exercise.id);
    const syllabusFiles = await commonFilesModel.getSyllabusFiles(
      exercise.syllabusId
    );

    // Combine files (exercise files take precedence if conflict)
    const allCommonFiles = [
      ...syllabusFiles.map((f) => ({
        filename: f.filename,
        content: f.content,
      })),
      ...exerciseFiles.map((f) => ({
        filename: f.filename,
        content: f.content,
      })),
    ];
    // Filter duplicates by filename, keeping the last one (exercise file overrides syllabus)
    const uniqueCommonFiles = Array.from(
      new Map(allCommonFiles.map((file) => [file.filename, file])).values()
    );

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
        runnerCode: tc.runnerCode || undefined,
        timeLimit: tc.timeLimitSeconds,
        memoryLimit: tc.memoryLimitMb,
        isHidden: tc.isHidden,
      })),
      limits: executionLimits,
      commonFiles: uniqueCommonFiles,
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

    let finalScore = Math.round((execResult.score / 100) * exercise.points);

    const hintsPenalty = await hintUsageModel.getTotalPenaltyForExercise(
      userId,
      exercise.id
    );

    if (hintsPenalty > 0) {
      finalScore = Math.max(0, finalScore - hintsPenalty);
    }

    if (isLate && exercise.lateSubmissionPenaltyPercent > 0) {
      const latePenalty =
        (finalScore * exercise.lateSubmissionPenaltyPercent) / 100;
      finalScore = Math.max(0, finalScore - latePenalty);
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
            status:
              tr.status === 'timeout'
                ? 'error'
                : (tr.status as 'passed' | 'failed' | 'error'),
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

    logger.info(
      `DEBUG: Processing submission ${submissionId}. Engine returned ${execResult.testResults.length} results. Mapped ${submissionTestResults.length} results.`
    );

    const finalVerdict = this.mapEngineVerdict(execResult.verdict);

    const updatedEntity = await submissionModel.updateResult(
      submissionId,
      finalVerdict,
      finalScore,
      submissionTestResults
    );

    // Cargar los test results con input/expectedOutput para la respuesta
    const testResultsWithDetails =
      await submissionModel.getTestResultsWithDetails(
        submissionId,
        UserRole.STUDENT
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

    const submissionDTO = submissionMapper.toDTO(updatedEntity);
    submissionDTO.testResults = testResultsWithDetails;

    return submissionDTO;
  }

  /**
   * Mapea el veredicto del motor de ejecución al veredicto interno
   */
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

  /**
   * Calcula el orden de eficiencia según tiempo y memoria usados
   * @returns Clasificación de eficiencia (BEST, GOOD, ACCEPTABLE, ANY)
   */
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

  async applyPlagiarismPenalty(submissionId: UUID): Promise<void> {
    const submission = await submissionModel.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Entrega no encontrada para penalizar');
    }

    await submissionModel.penalize(
      submissionId,
      SubmissionVerdict.WRONG_ANSWER,
      0
    );

    logger.warn(`Entrega ${submissionId} penalizada por plagio confirmado.`);
  }

  private async triggerPlagiarismCheck(
    submissionId: UUID,
    exerciseId: UUID,
    currentStudentId: UUID
  ) {
    const previousSubmissions =
      await submissionModel.findAllByExerciseId(exerciseId);

    for (const prev of previousSubmissions) {
      if (prev.student.id !== currentStudentId) {
        await plagiarismService.runBasicComparison(submissionId, prev.id);
      }
    }
  }

  private async checkBehavioralAnomaly(
    studentId: UUID,
    exerciseId: UUID,
    currentSubmissionId: UUID
  ) {
    const RECENT_MINUTES = 1;
    const MAX_ATTEMPTS_THRESHOLD = 5;

    const recentCount = await submissionModel.countRecentSubmissions(
      studentId,
      exerciseId,
      RECENT_MINUTES
    );

    if (recentCount >= MAX_ATTEMPTS_THRESHOLD) {
      await plagiarismService.createCheck({
        submissionId: currentSubmissionId,
        comparedWithSubmissionId: currentSubmissionId,
        similarityPercent: 100,
        plagiarismType: PlagiarismType.INTERNAL,
        isFlagged: true,
        toolUsed: 'Behavioral Analysis (Rate Limiting)',
        notes: `ALERTA DE COMPORTAMIENTO: ${recentCount} intentos en <${RECENT_MINUTES} min. Posible "gambling" (fuerza bruta).`,
      });

      logger.warn(
        `Anomalía de comportamiento detectada para usuario ${studentId}`
      );
    }
  }

  /**
   * Archiva una entrega manualmente (profesor/admin)
   * @param submissionId - ID de la entrega a archivar
   * @param userId - ID del usuario que realiza la acción
   * @param userRole - Rol del usuario
   */
  async archiveSubmission(
    submissionId: UUID,
    userId: UUID,
    userRole: UserRole
  ): Promise<void> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        'Solo profesores y administradores pueden archivar entregas'
      );
    }

    const submission = await submissionModel.getDetailsById(submissionId);
    if (!submission) {
      throw new NotFoundError('Entrega no encontrada');
    }

    const isArchived = await submissionModel.isArchived(submissionId);
    if (isArchived) {
      throw new ValidationError('La entrega ya está archivada');
    }

    await submissionModel.archiveSubmission(
      submissionId,
      userId,
      'teacher_deleted'
    );

    await auditService.log(
      'ARCHIVE_SUBMISSION',
      'submission',
      submissionId,
      {
        studentId: submission.student.id,
        exerciseId: submission.exercise.id,
        reason: 'Manual deletion by teacher',
      },
      userId
    );

    logger.info(`Entrega ${submissionId} archivada por usuario ${userId}`);
  }

  /**
   * Restaura una entrega archivada (profesor/admin)
   * @param submissionId - ID de la entrega a restaurar
   * @param userId - ID del usuario que realiza la acción
   * @param userRole - Rol del usuario
   */
  async restoreSubmission(
    submissionId: UUID,
    userId: UUID,
    userRole: UserRole
  ): Promise<void> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError(
        'Solo profesores y administradores pueden restaurar entregas'
      );
    }

    const submission = await submissionModel.getDetailsById(submissionId);
    if (!submission) {
      throw new NotFoundError('Entrega no encontrada');
    }

    const isArchived = await submissionModel.isArchived(submissionId);
    if (!isArchived) {
      throw new ValidationError('La entrega no está archivada');
    }

    await submissionModel.restoreSubmission(submissionId);

    await auditService.log(
      'RESTORE_SUBMISSION',
      'submission',
      submissionId,
      {
        studentId: submission.student.id,
        exerciseId: submission.exercise.id,
      },
      userId
    );

    logger.info(`Entrega ${submissionId} restaurada por usuario ${userId}`);
  }
}

export const submissionService = new SubmissionService();
