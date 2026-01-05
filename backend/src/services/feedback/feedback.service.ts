import { feedbackModel } from '@models/feedback/feedback.model';
import {
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from '@validators/feedback.validator';
import { UserRole, UUID } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { ForbiddenError, NotFoundError } from '@utils/errors';
import { FeedbackVisibility } from '@models/feedback/feedback.entity';
import { groupModel } from '@models/group/group.model';
import { auditService } from '@services/audit/audit.service';
import { exerciseModel } from '@models/exercise/exercise.model';

export class FeedbackService {
  async createFeedback(input: CreateFeedbackInput, teacherId: UUID) {
    const submission = await submissionModel.getById(
      input.submissionId as UUID
    );

    if (!submission) throw new NotFoundError('Entrega no encontrada');

    const feedback = await feedbackModel.create(input, teacherId);

    if (input.scoreAdjustment !== 0) {
      await this.applyScoreAdjustment(
        input.submissionId,
        input.scoreAdjustment
      );
    }

    await auditService.log(
      'CREATE_FEEDBACK',
      'feedback',
      feedback.id,
      {
        submissionId: input.submissionId,
        scoreAdjustment: input.scoreAdjustment,
        visibility: input.visibility,
      },
      teacherId
    );

    return feedback;
  }

  async getFeedbackBySubmission(
    submissionId: string,
    requestingUserRole: UserRole,
    requestingUserId: string
  ) {
    const feedbacks = await feedbackModel.listBySubmission(
      submissionId as UUID
    );

    if (
      requestingUserRole === UserRole.ADMIN ||
      requestingUserRole === UserRole.TEACHER
    ) {
      return feedbacks;
    }

    const submission = await submissionModel.getById(submissionId as UUID);

    if (submission?.studentId === requestingUserId) {
      return feedbacks.filter(
        (f) => f.visibility !== FeedbackVisibility.PRIVATE
      );
    }

    const ownerGroupId = await groupModel.getStudentGroupInCourse(
      submission?.courseId as UUID,
      submission?.studentId as UUID
    );

    const isRequesterInGroup = ownerGroupId
      ? await groupModel.isMember(ownerGroupId, requestingUserId as UUID)
      : false;

    return feedbacks.filter((f) => {
      if (f.visibility === FeedbackVisibility.PRIVATE) return false;
      if (f.visibility === FeedbackVisibility.STUDENT) return false;

      if (f.visibility === FeedbackVisibility.GROUP) {
        return isRequesterInGroup;
      }

      return true;
    });
  }

  async updateFeedback(
    id: string,
    input: UpdateFeedbackInput,
    teacherId: UUID,
    isAdmin: boolean
  ) {
    const oldFeedback = await feedbackModel.getById(id as UUID);

    if (oldFeedback.teacherId !== teacherId && !isAdmin) {
      throw new ForbiddenError('No puedes editar feedback que no creaste');
    }

    const updatedFeedback = await feedbackModel.update(id as UUID, input);

    if (
      input.scoreAdjustment !== undefined &&
      input.scoreAdjustment !== oldFeedback.scoreAdjustment
    ) {
      const delta = input.scoreAdjustment - oldFeedback.scoreAdjustment;
      await this.applyScoreAdjustment(oldFeedback.submissionId, delta);
    }

    await auditService.log(
      'UPDATE_FEEDBACK',
      'feedback',
      updatedFeedback.id,
      {
        changes: input,
      },
      teacherId
    );

    return updatedFeedback;
  }

  async deleteFeedback(id: string, teacherId: UUID, isAdmin: boolean) {
    const feedback = await feedbackModel.getById(id as UUID);

    if (feedback.teacherId !== teacherId && !isAdmin) {
      throw new ForbiddenError('No puedes eliminar feedback que no creaste');
    }

    await feedbackModel.delete(id as UUID);

    if (feedback.scoreAdjustment !== 0) {
      await this.applyScoreAdjustment(
        feedback.submissionId,
        -feedback.scoreAdjustment
      );
    }

    await auditService.log(
      'DELETE_FEEDBACK',
      'feedback',
      id,
      undefined,
      teacherId
    );
  }

  private async applyScoreAdjustment(
    submissionId: string,
    adjustmentDelta: number
  ) {
    if (adjustmentDelta === 0) return;

    const submission = await submissionModel.getById(submissionId);
    if (!submission) return;

    const exercise = await exerciseModel.getById(submission.exerciseId);
    const maxPoints = exercise ? exercise.points : 10;

    let newScore = submission.score + adjustmentDelta;

    newScore = Math.max(0, Math.min(newScore, maxPoints));

    await submissionModel.updateScore(submission.id, newScore);
  }
}

export const feedbackService = new FeedbackService();
