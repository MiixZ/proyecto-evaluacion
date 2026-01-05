import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { exerciseService } from '@services/exercise/exercise.service';
import { CreateExerciseInput } from '@validators/exercise.validator';
import { UserRole, UUID } from '@CustomTypes/common.types';
import { AppError } from '@utils/errors';

/**
 * Controlador para gestión de ejercicios de programación
 * Maneja creación, consulta, publicación y listado de ejercicios
 */
export class ExerciseController {
  /**
   * Crea un nuevo ejercicio (profesores y admin)
   */
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No autorizado para crear ejercicios'
      );
    }

    const input = req.body as CreateExerciseInput;
    const result = await exerciseService.createExercise(input, req.user!.id);

    return ApiResponse.created(res, result, 'Ejercicio creado correctamente');
  });

  /**
   * Obtiene un ejercicio por ID
   * Filtra información sensible si el usuario es estudiante
   */
  getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const isStudent = req.user?.role === UserRole.STUDENT;

    const result = await exerciseService.getExerciseById(id as UUID, isStudent);

    return ApiResponse.success(res, result);
  });

  listBySyllabus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { syllabusId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isStudent = req.user?.role === UserRole.STUDENT;

    const result = await exerciseService.listExercisesBySyllabus(
      syllabusId as UUID,
      page,
      limit,
      isStudent
    );

    return ApiResponse.success(res, result);
  });

  listAll = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Acceso permitido solo a administradores'
      );
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await exerciseService.listAllExercises(page, limit, search);

    return ApiResponse.success(res, result);
  });

  /**
   * Publica u oculta un ejercicio (profesores y admin)
   */
  togglePublish = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'Acción no permitida');
    }

    const result = await exerciseService.togglePublishStatus(
      id as UUID,
      isPublished
    );

    return ApiResponse.success(
      res,
      result,
      200,
      `Ejercicio ${isPublished ? 'publicado' : 'ocultado'}`
    );
  });

  getMyExercises = catchAsync(async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.id;

    if (!teacherId || req.user?.role === UserRole.STUDENT) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'No autorizado para ver ejercicios de profesor'
      );
    }

    const exercises = await exerciseService.getProfessorExercises(teacherId);

    return ApiResponse.success(res, exercises);
  });

  clone = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId || req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'Acción no permitida');
    }

    const result = await exerciseService.cloneExercise(
      id as UUID,
      teacherId as UUID
    );

    return ApiResponse.success(
      res,
      result,
      200,
      'Ejercicio clonado correctamente'
    );
  });

  update = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId || req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'Acción no permitida');
    }

    const input = req.body as CreateExerciseInput;
    const result = await exerciseService.updateExercise(
      id as UUID,
      input,
      teacherId as UUID
    );

    return ApiResponse.success(
      res,
      result,
      200,
      'Ejercicio actualizado correctamente'
    );
  });

  delete = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId || req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'Acción no permitida');
    }

    await exerciseService.deleteExercise(id as UUID, teacherId as UUID);

    return ApiResponse.success(
      res,
      { success: true },
      200,
      'Ejercicio eliminado correctamente'
    );
  });
}

export const exerciseController = new ExerciseController();
