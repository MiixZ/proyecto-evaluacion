import { plagiarismModel } from '@models/plagiarism/plagiarism.model';
import {
  CreatePlagiarismCheckInput,
  ReviewPlagiarismInput,
} from '@validators/plagiarism.validator';
import { UUID, PlagiarismType } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { exerciseModel } from '@models/exercise/exercise.model';
import { winnowingService } from './winnowing.service';
import { auditService } from '@services/audit/audit.service';
import { submissionService } from '@services/submission/submission.service';
import { FeedbackVisibility } from '@models/feedback/feedback.entity';
import { feedbackService } from '@services/feedback/feedback.service';

/**
 * Servicio para detección y revisión de plagio académico
 * Coordina la comparación de código y aplicación de penalizaciones
 */
export class PlagiarismService {
  /**
   * Crea un nuevo registro de chequeo de plagio
   * @param input - Datos del chequeo incluyendo envíos comparados
   * @returns Registro del chequeo creado
   */
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

  /**
   * Revisa un chequeo de plagio y aplica penalizaciones si procede
   * @param id - ID del chequeo de plagio
   * @param input - Datos de la revisión (flagged, notas)
   * @param reviewerId - ID del revisor
   * @returns Chequeo actualizado
   */
  async reviewCheck(
    id: string,
    input: ReviewPlagiarismInput,
    reviewerId: UUID
  ) {
    const originalCheck = await plagiarismModel.getById(id as UUID);
    if (!originalCheck) throw new Error('Chequeo de plagio no encontrado');

    const updatedCheck = await plagiarismModel.updateReview(
      id as UUID,
      input,
      reviewerId
    );

    if (input.isFlagged) {
      try {
        await submissionService.applyPlagiarismPenalty(
          originalCheck.submissionId
        );

        await feedbackService.createFeedback(
          {
            submissionId: originalCheck.submissionId,
            content: 'Acusado de plagio',
            isGeneral: true,
            scoreAdjustment: 0,
            visibility: FeedbackVisibility.STUDENT,
            lineNumber: undefined,
          },
          reviewerId
        );
      } catch (error) {
        console.error(
          'Error al aplicar penalización o feedback de plagio:',
          error
        );
      }
    }

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

  /**
   * Ejecuta una comparación automática entre dos envíos usando Winnowing
   * @param submissionId - ID del envío fuente
   * @param targetSubmissionId - ID del envío a comparar
   * @returns Porcentaje de similitud (0-100)
   */
  async runBasicComparison(
    submissionId: UUID,
    targetSubmissionId: UUID
  ): Promise<number> {
    const source = await submissionModel.getById(submissionId);
    const target = await submissionModel.getById(targetSubmissionId);

    let templateCode = '';
    let runnerCodes: string[] = [];

    if (source?.exerciseId) {
      const exercise = await exerciseModel.getById(source.exerciseId as UUID);
      if (exercise) {
        templateCode = exercise.templateCode || '';
        const testCases = await exerciseModel.getTestCases(
          source.exerciseId as UUID
        );
        runnerCodes = testCases
          .map((tc) => tc.runnerCode)
          .filter((code): code is string => !!code && code.trim() !== '');
      }
    }

    const sourceCode = this.extractStudentCode(
      source?.code!,
      templateCode,
      runnerCodes
    );
    const targetCode = this.extractStudentCode(
      target?.code!,
      templateCode,
      runnerCodes
    );

    const similarityScore = this.calculateSimilarity(sourceCode, targetCode);
    const similarityPercent = Math.round(similarityScore * 100);

    const SIMILARITY_THRESHOLD = 50;
    const isFlagged = similarityPercent >= SIMILARITY_THRESHOLD;

    const check = await this.createCheck({
      submissionId,
      comparedWithSubmissionId: targetSubmissionId,
      similarityPercent: similarityPercent,
      plagiarismType: PlagiarismType.INTERNAL,
      isFlagged,
      toolUsed: 'Winnowing Algorithm (Jaccard Index)',
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
    return winnowingService.calculateSimilarity(code1, code2);
  }

  /**
   * Extrae solo el código del estudiante, eliminando template_code y runner_code del profesor
   * @param fullCode - Código completo del envío
   * @param templateCode - Código plantilla del ejercicio
   * @param runnerCodes - Códigos runner de los test cases
   * @returns Código con las partes del profesor eliminadas
   */
  private extractStudentCode(
    fullCode: string,
    templateCode: string,
    runnerCodes: string[]
  ): string {
    if (!fullCode) return '';

    let studentCode = fullCode;

    if (templateCode && templateCode.trim()) {
      studentCode = studentCode.replace(templateCode, '');

      const normalizedTemplate = templateCode.replace(/\s+/g, ' ').trim();
      const normalizedCode = studentCode.replace(/\s+/g, ' ');
      if (normalizedCode.includes(normalizedTemplate)) {
        studentCode = normalizedCode.replace(normalizedTemplate, '');
      }
    }

    for (const runnerCode of runnerCodes) {
      if (runnerCode && runnerCode.trim()) {
        studentCode = studentCode.replace(runnerCode, '');

        const normalizedRunner = runnerCode.replace(/\s+/g, ' ').trim();
        const normalizedCode = studentCode.replace(/\s+/g, ' ');
        if (normalizedCode.includes(normalizedRunner)) {
          studentCode = normalizedCode.replace(normalizedRunner, '');
        }
      }
    }

    return studentCode.trim();
  }

  /**
   * Obtiene análisis de patrones de plagio para un estudiante
   */
  async findStudentPatterns(studentId: string) {
    return await plagiarismModel.findStudentPatterns(studentId as UUID);
  }
}

export const plagiarismService = new PlagiarismService();
