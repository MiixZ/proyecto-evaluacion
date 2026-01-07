import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { submissionService } from '@services/submission/submission.service';
import { UUID } from '@CustomTypes/common.types';
import { CreateSubmissionInput } from '@validators/submission.validator';

/**
 * Controlador para envíos de código de estudiantes
 * Maneja envío, evaluación y consulta de historial
 */
export class SubmissionController {
  /**
   * Envía y evalúa código de un estudiante
   */
  submitCode = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const input = req.body as CreateSubmissionInput;

    const resultDTO = await submissionService.processSubmission(
      userId as UUID,
      {
        ...input,
        courseId: input.courseId as UUID,
      }
    );

    return ApiResponse.created(
      res,
      resultDTO,
      'Solución enviada y evaluada correctamente'
    );
  });

  /**
   * Obtiene el historial de envíos del estudiante autenticado
   */
  getHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { exerciseId } = req.query;

    const history = await submissionService.getStudentHistory(
      userId as UUID,
      exerciseId ? (exerciseId as UUID) : undefined
    );

    return ApiResponse.success(res, history, 200, 'Historial recuperado');
  });

  /**
   * Obtiene detalles de un envío específico
   */
  getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await submissionService.getSubmissionById(
      req.params.id as UUID,
      req.user!.id as UUID,
      req.user!.role
    );

    return ApiResponse.success(res, result);
  });

  /**
   * Archiva una entrega (soft delete)
   * Solo para profesores y administradores
   */
  archiveSubmission = catchAsync(async (req: AuthRequest, res: Response) => {
    const submissionId = req.params.id as UUID;

    await submissionService.archiveSubmission(
      submissionId,
      req.user!.id as UUID,
      req.user!.role
    );

    return ApiResponse.success(
      res,
      { archived: true },
      200,
      'Entrega archivada correctamente'
    );
  });

  /**
   * Restaura una entrega archivada
   * Solo para profesores y administradores
   */
  restoreSubmission = catchAsync(async (req: AuthRequest, res: Response) => {
    const submissionId = req.params.id as UUID;

    await submissionService.restoreSubmission(
      submissionId,
      req.user!.id as UUID,
      req.user!.role
    );

    return ApiResponse.success(
      res,
      { restored: true },
      200,
      'Entrega restaurada correctamente'
    );
  });
}

export const submissionController = new SubmissionController();
