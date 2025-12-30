import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { hintService } from '@services/hint/hint.service';
import { hintMapper } from '@mappers/hint.mapper';
import { UUID } from '@CustomTypes/common.types';

export class HintController {
  requestHint = catchAsync(async (req: AuthRequest, res: Response) => {
    const { submissionId, testCaseId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const hintEntity = await hintService.requestHint(
      userId as UUID,
      userRole,
      submissionId as UUID,
      testCaseId as UUID
    );

    return ApiResponse.success(
      res,
      hintMapper.toDTO(hintEntity),
      200,
      'Pista obtenida correctamente'
    );
  });
}

export const hintController = new HintController();
