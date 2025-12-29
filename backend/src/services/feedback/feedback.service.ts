import { feedbackModel } from '@models/feedback/feedback.model';
import {
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from '@validators/feedback.validator';
import { UUID } from '@CustomTypes/common.types';
import { submissionModel } from '@models/submission/submission.model';
import { ForbiddenError } from '@utils/errors';

export class FeedbackService {
  async createFeedback(input: CreateFeedbackInput, teacherId: UUID) {
    await submissionModel.getById(input.submissionId as UUID);

    return await feedbackModel.create(input, teacherId);
  }

  async getFeedbackBySubmission(submissionId: string) {
    return await feedbackModel.listBySubmission(submissionId as UUID);
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

    return await feedbackModel.update(id as UUID, input);
  }

  async deleteFeedback(id: string, teacherId: UUID, isAdmin: boolean) {
    const feedback = await feedbackModel.getById(id as UUID);

    if (feedback.teacherId !== teacherId && !isAdmin) {
      throw new ForbiddenError('No puedes eliminar feedback que no creaste');
    }

    await feedbackModel.delete(id as UUID);
  }
}

export const feedbackService = new FeedbackService();
