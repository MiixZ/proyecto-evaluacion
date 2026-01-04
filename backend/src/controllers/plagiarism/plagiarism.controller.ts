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
      throw new AppError(
        'FORBIDDEN',
        403,
        'No autorizado para registrar chequeos de plagio'
      );
    }

    const result = await plagiarismService.createCheck(req.body);

    return ApiResponse.created(
      res,
      plagiarismMapper.toDTO(result),
      'Chequeo registrado correctamente'
    );
  });

  getBySubmission = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No autorizado para ver reportes de plagio'
      );
    }

    const { submissionId } = req.params;
    const result = await plagiarismService.getBySubmission(submissionId);

    return ApiResponse.success(res, plagiarismMapper.toDTOList(result));
  });

  getOne = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { id } = req.params;
    const result = await plagiarismService.getById(id);

    if (!result) {
      throw new AppError('NOT_FOUND', 404, 'Chequeo de plagio no encontrado');
    }

    return ApiResponse.success(res, plagiarismMapper.toDTO(result));
  });

  review = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No autorizado para revisar plagios'
      );
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
      'Revisión actualizada correctamente'
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
