import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { subjectService } from '@services/subject/subject.service';
import { subjectMapper } from '@mappers/subject.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class SubjectController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden crear asignaturas'
      );
    }

    const result = await subjectService.createSubject(req.body);

    return ApiResponse.created(
      res,
      subjectMapper.toDTO(result),
      'Asignatura creada'
    );
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const result = await subjectService.getSubjectById(req.params.id);

    return ApiResponse.success(res, subjectMapper.toDTO(result));
  });

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden editar asignaturas'
      );
    }

    const result = await subjectService.updateSubject(req.params.id, req.body);

    return ApiResponse.success(
      res,
      subjectMapper.toDTO(result),
      201,
      'Asignatura actualizada'
    );
  });

  list = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await subjectService.listSubjects(page, limit, {
      degreeId: req.query.degreeId as string,
      status: req.query.status as string,
    });

    return ApiResponse.success(res, {
      ...result,
      items: subjectMapper.toDTOList(result.items),
    });
  });
}

export const subjectController = new SubjectController();
