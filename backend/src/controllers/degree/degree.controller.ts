import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { degreeService } from '@services/degree/degree.service';
import { degreeMapper } from '@mappers/degree.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class DegreeController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden crear titulaciones'
      );
    }

    const result = await degreeService.createDegree(req.body);

    return ApiResponse.created(
      res,
      degreeMapper.toDTO(result),
      'Titulación creada'
    );
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const result = await degreeService.getDegreeById(req.params.id);

    return ApiResponse.success(res, degreeMapper.toDTO(result));
  });

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden editar titulaciones'
      );
    }
    const result = await degreeService.updateDegree(req.params.id, req.body);

    return ApiResponse.success(
      res,
      degreeMapper.toDTO(result),
      201,
      'Titulación actualizada'
    );
  });

  list = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await degreeService.listDegrees(page, limit, {
      status: req.query.status as string,
      search: req.query.search as string,
    });

    return ApiResponse.success(res, {
      ...result,
      items: degreeMapper.toDTOList(result.items),
    });
  });
}

export const degreeController = new DegreeController();
