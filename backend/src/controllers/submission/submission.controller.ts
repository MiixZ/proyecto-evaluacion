import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { submissionService } from '@services/submission/submission.service';
import { UUID } from '@CustomTypes/common.types';
import { CreateSubmissionInput } from '@validators/submission.validator';

export class SubmissionController {
  submitCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const input = req.body as CreateSubmissionInput;

    const resultDTO = await submissionService.processSubmission(
      userId as UUID,
      {
        ...input,
        courseId: input.courseId as UUID,
      }
    );

    return ApiResponse.created(
      res,
      resultDTO,
      'Solución enviada y evaluada correctamente'
    );
  });

  getHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { exerciseId } = req.query;

    const history = await submissionService.getStudentHistory(
      userId as UUID,
      exerciseId ? (exerciseId as UUID) : undefined
    );

    return ApiResponse.success(res, history, 200, 'Historial recuperado');
  });

  getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await submissionService.getSubmissionById(
      req.params.id as UUID,
      req.user!.id as UUID,
      req.user!.role
    );

    return ApiResponse.success(res, result);
  });
}

export const submissionController = new SubmissionController();
