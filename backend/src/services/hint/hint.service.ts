import { hintUsageModel } from '@models/hint/hint-usage.model';
import { submissionModel } from '@models/submission/submission.model';
import { exerciseModel } from '@models/exercise/exercise.model';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { NotFoundError, ForbiddenError, ValidationError } from '@utils/errors';
import { getPool } from '@config/database';

export class HintService {
  async requestHint(
    userId: UUID,
    userRole: UserRole,
    submissionId: UUID,
    testCaseId: UUID
  ) {
    const submission = await submissionModel.getById(submissionId);

    if (!submission) {
      throw new NotFoundError('Entrega no encontrada');
    }

    if (userRole === UserRole.STUDENT && submission?.studentId !== userId) {
      throw new ForbiddenError(
        'No tienes permiso para ver pistas de este envío'
      );
    }

    const existingUsage = await hintUsageModel.findBySubmissionAndTestCase(
      submissionId,
      testCaseId
    );

    if (existingUsage) {
      return existingUsage;
    }

    const exercise = await exerciseModel.getById(submission.exerciseId);
    const testCases = await exerciseModel.getTestCases(submission.exerciseId);
    const targetTestCase = testCases.find((tc) => tc.id === testCaseId);

    if (!targetTestCase) {
      throw new NotFoundError('Caso de prueba no encontrado en este ejercicio');
    }

    if (!targetTestCase.hintText) {
      throw new ValidationError(
        'Este caso de prueba no tiene pistas disponibles'
      );
    }

    const penaltyPercent = targetTestCase.hintPenaltyPercent || 0;
    const penaltyPoints = Math.ceil((exercise.points * penaltyPercent) / 100);

    const hintUsage = await hintUsageModel.create({
      submissionId,
      testCaseId,
      hintText: targetTestCase.hintText,
      penaltyApplied: penaltyPoints,
    });

    if (!submission.usedHint) {
      await getPool().execute(
        'UPDATE submissions SET used_hint = 1 WHERE id = ?',
        [submissionId]
      );
    }

    return hintUsage;
  }
}

export const hintService = new HintService();
