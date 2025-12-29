import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { syllabusService } from '@services/syllabus/syllabus.service';
import { CreateSyllabusInput } from '@validators/syllabus.validator';
import { syllabusMapper } from '@mappers/syllabus.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class SyllabusController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No autorizado para crear contenido educativo'
      );
    }

    const input = req.body as CreateSyllabusInput;
    const result = await syllabusService.createSyllabus(input);

    return ApiResponse.created(
      res,
      syllabusMapper.toDTO(result),
      'Temario creado correctamente'
    );
  });

  listByCourse = catchAsync(async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;

    // TODO: Agregar validación extra: ¿El usuario está matriculado en este curso?
    // Por ahora permitimos lectura si está autenticado

    const result = await syllabusService.getByCourse(courseId);

    return ApiResponse.success(res, syllabusMapper.toDTOList(result));
  });
}

export const syllabusController = new SyllabusController();
