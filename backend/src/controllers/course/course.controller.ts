import { Response, Request } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { courseService } from '@services/course/course.service';
import { courseMapper } from '@mappers/course.mapper';
import { AppError } from '@utils/errors';
import { UserRole, CourseStatus } from '@CustomTypes/common.types';

export class CourseController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden crear cursos'
      );
    }

    const result = await courseService.createCourse(req.body);

    return ApiResponse.created(
      res,
      courseMapper.toDTO(result),
      'Curso creado correctamente'
    );
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const result = await courseService.getCourseById(req.params.id);

    return ApiResponse.success(res, courseMapper.toDTO(result));
  });

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Solo administradores pueden editar cursos'
      );
    }

    const result = await courseService.updateCourse(req.params.id, req.body);

    return ApiResponse.success(res, courseMapper.toDTO(result));
  });

  list = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await courseService.listCourses(page, limit, {
      status: req.query.status as CourseStatus,
      academicYear: req.query.academicYear as string,
    });

    return ApiResponse.success(res, {
      ...result,
      items: courseMapper.toDTOList(result.items),
    });
  });
}

export const courseController = new CourseController();
