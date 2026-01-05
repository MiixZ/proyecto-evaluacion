import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { syllabusService } from '@services/syllabus/syllabus.service';
import {
  CreateSyllabusInput,
  UpdateSyllabusInput,
} from '@validators/syllabus.validator';
import { syllabusMapper } from '@mappers/syllabus.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class SyllabusController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const input = req.body as CreateSyllabusInput;
    const result = await syllabusService.createSyllabus(input);

    return ApiResponse.created(
      res,
      syllabusMapper.toDTO(result),
      'Temario creado'
    );
  });

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { id } = req.params;
    const input = req.body as UpdateSyllabusInput;

    const result = await syllabusService.updateSyllabus(id, input);

    return ApiResponse.success(
      res,
      syllabusMapper.toDTO(result),
      200,
      'Temario actualizado'
    );
  });

  toggleVisibility = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { id } = req.params;
    const result = await syllabusService.toggleVisibility(id);

    return ApiResponse.success(
      res,
      syllabusMapper.toDTO(result),
      200,
      result.isPublic
        ? 'Temario visible para estudiantes'
        : 'Temario oculto para estudiantes'
    );
  });

  list = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const result = await syllabusService.listSyllabi(page, limit, {
      courseId: req.query.courseId as string,
    });

    return ApiResponse.success(res, {
      ...result,
      items: syllabusMapper.toDTOList(result.items),
    });
  });

  listByCourse = catchAsync(async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    const result = await syllabusService.getByCourse(
      courseId,
      req.user!.id,
      req.user!.role
    );
    return ApiResponse.success(res, syllabusMapper.toDTOList(result));
  });

  delete = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { id } = req.params;
    await syllabusService.deleteSyllabus(id);

    return ApiResponse.success(res, null, 200, 'Temario eliminado');
  });

  updateOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const { id } = req.params;
    const { orderIndex } = req.body;

    const result = await syllabusService.updateOrder(id, orderIndex);

    return ApiResponse.success(
      res,
      syllabusMapper.toDTO(result),
      200,
      'Orden actualizado'
    );
  });
}

export const syllabusController = new SyllabusController();
