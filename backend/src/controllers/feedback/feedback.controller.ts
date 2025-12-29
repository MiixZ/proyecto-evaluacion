import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { feedbackService } from '@services/feedback/feedback.service';
import { feedbackMapper } from '@mappers/feedback.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class FeedbackController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado para crear feedback');
    }

    const result = await feedbackService.createFeedback(req.body, req.user!.id);

    return ApiResponse.created(
      res,
      feedbackMapper.toDTO(result),
      'Feedback añadido'
    );
  });

  getBySubmission = catchAsync(async (req: AuthRequest, res: Response) => {
    const { submissionId } = req.params;

    const result = await feedbackService.getFeedbackBySubmission(
      submissionId,
      req.user!.role,
      req.user!.id
    );

    return ApiResponse.success(res, feedbackMapper.toDTOList(result));
  });

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const isAdmin = req.user?.role === UserRole.ADMIN;
    const result = await feedbackService.updateFeedback(
      req.params.id,
      req.body,
      req.user!.id,
      isAdmin
    );

    return ApiResponse.success(
      res,
      feedbackMapper.toDTO(result),
      200,
      'Feedback actualizado'
    );
  });

  delete = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const isAdmin = req.user?.role === UserRole.ADMIN;
    await feedbackService.deleteFeedback(req.params.id, req.user!.id, isAdmin);

    return ApiResponse.success(res, null, 200, 'Feedback eliminado');
  });
}

export const feedbackController = new FeedbackController();
