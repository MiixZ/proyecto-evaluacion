import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { exportService } from '@services/export/export.service';
import { exportMapper } from '@mappers/export.mapper';

export class ExportController {
  create = catchAsync(async (req: AuthRequest, res: Response) => {
    const { content, mimeType, filename } = await exportService.generateExport(
      req.body,
      req.user!.id,
      req.user!.role
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(201).send(content);
  });

  getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await exportService.getExportById(
      req.params.id,
      req.user!.role
    );

    return ApiResponse.success(res, exportMapper.toDTO(result));
  });

  download = catchAsync(async (req: AuthRequest, res: Response) => {
    const { content, mimeType, filename } =
      await exportService.regenerateExport(req.params.id, req.user!.role);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send(content);
  });

  list = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await exportService.listExports(
      page,
      limit,
      {
        purpose: req.query.purpose as string,
        format: req.query.format as string,
      },
      req.user!.role
    );

    return ApiResponse.success(res, {
      ...result,
      items: exportMapper.toDTOList(result.items),
    });
  });
}

export const exportController = new ExportController();
