import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { exportService } from '@services/export/export.service';
import { exportMapper } from '@mappers/export.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class ExportController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado para exportar datos');
    }

    const { content, mimeType, filename } = await exportService.generateExport(
      req.body,
      req.user!.id
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return ApiResponse.success(
      res,
      content,
      201,
      'Exportación generada exitosamente'
    );
  });

  download = catchAsync(async (req: AuthRequest, res: Response) => {
    const { content, mimeType, filename } =
      await exportService.regenerateExport(req.params.id, req.user!.role);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return ApiResponse.success(
      res,
      content,
      200,
      'Archivo descargado exitosamente'
    );
  });

  list = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === UserRole.STUDENT) {
      throw new AppError('FORBIDDEN', 403, 'No autorizado');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await exportService.listExports(page, limit, {
      purpose: req.query.purpose as string,
      format: req.query.format as string,
    });

    return ApiResponse.success(res, {
      ...result,
      items: exportMapper.toDTOList(result.items),
    });
  });
}

export const exportController = new ExportController();
