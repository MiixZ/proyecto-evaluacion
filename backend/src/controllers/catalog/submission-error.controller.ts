import { Request, Response } from 'express';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { submissionErrorService } from '@services/catalog/submission-error.service';
import { submissionErrorMapper } from '@mappers/submission-error.mapper';

export class SubmissionErrorController {
  list = catchAsync(async (_req: Request, res: Response) => {
    const errors = await submissionErrorService.getActiveErrors();
    return ApiResponse.success(res, submissionErrorMapper.toDTOList(errors));
  });
}

export const submissionErrorController = new SubmissionErrorController();
