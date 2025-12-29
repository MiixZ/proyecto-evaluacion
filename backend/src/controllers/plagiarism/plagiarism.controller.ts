import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { plagiarismService } from '@services/plagiarism/plagiarism.service';
import { plagiarismMapper } from '@mappers/plagiarism.mapper';
import { AppError } from '@utils/errors';
import { UserRole, PlagiarismType } from '@CustomTypes/common.types';

export class PlagiarismController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const result = await plagiarismService.createCheck(req.body);

    return ApiResponse.created(
      res,
      plagiarismMapper.toDTO(result),
      'Chequeo registrado'
    );
  });

  getBySubmission = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      // TODO: Validar si el estudiante es dueño de la submission
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { submissionId } = req.params;
    const result = await plagiarismService.getBySubmission(submissionId);

    return ApiResponse.success(res, plagiarismMapper.toDTOList(result));
  });

  review = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const result = await plagiarismService.reviewCheck(
      req.params.id,
      req.body,
      req.user!.id
    );

    return ApiResponse.success(
      res,
      plagiarismMapper.toDTO(result),
      200,
      'Revisión actualizada'
    );
  });

  list = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await plagiarismService.listChecks(page, limit, {
      isFlagged:
        req.query.isFlagged === 'true'
          ? true
          : req.query.isFlagged === 'false'
            ? false
            : undefined,
      type: req.query.type as PlagiarismType,
    });

    return ApiResponse.success(res, {
      ...result,
      items: plagiarismMapper.toDTOList(result.items),
    });
  });
}

export const plagiarismController = new PlagiarismController();
