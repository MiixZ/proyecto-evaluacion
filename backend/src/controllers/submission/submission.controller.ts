import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { submissionService } from '@services/submission/submission.service';
import { createSubmissionSchema } from '@validators/schemas';
import { z } from 'zod';
import { UUID } from '@CustomTypes/common.types';

const submitSchema = createSubmissionSchema.extend({
  courseId: z.string().uuid(),
});

export class SubmissionController {
  submitCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const input = submitSchema.parse(req.body);

    const result = await submissionService.processSubmission(
      userId as UUID,
      input as any
    );

    return ApiResponse.created(
      res,
      result,
      'Solución enviada y evaluada correctamente'
    );
  });

  // TODO: getSubmissionById, listSubmissionsByExercise, etc.
}

export const submissionController = new SubmissionController();
