import { feedbackModel } from '@models/feedback/feedback.model';
import {
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from '@validators/feedback.validator';
import { UserRole, UUID } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { ForbiddenError } from '@utils/errors';
import { FeedbackVisibility } from '@models/feedback/feedback.entity';
import { groupModel } from '@models/group/group.model';
import { auditService } from '@services/audit/audit.service';

export class FeedbackService {
  async createFeedback(input: CreateFeedbackInput, teacherId: UUID) {
    await submissionModel.getById(input.submissionId as UUID);

    const feedback = await feedbackModel.create(input, teacherId);

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

    if (submission.studentId === requestingUserId) {
      return feedbacks.filter(
        (f) => f.visibility !== FeedbackVisibility.PRIVATE
      );
    }

    const ownerGroupId = await groupModel.getStudentGroupInCourse(
      submission.courseId,
      submission.studentId
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
    const feedback = await feedbackModel.getById(id as UUID);

    if (feedback.teacherId !== teacherId && !isAdmin) {
      throw new ForbiddenError('No puedes editar feedback que no creaste');
    }

    const updatedFeedback = await feedbackModel.update(id as UUID, input);

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

    await auditService.log(
      'DELETE_FEEDBACK',
      'feedback',
      id,
      undefined,
      teacherId
    );
  }
}

export const feedbackService = new FeedbackService();
