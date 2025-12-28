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

    const input = req.body as CreateSubmissionInput & { courseId: string };

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
}

export const submissionController = new SubmissionController();
