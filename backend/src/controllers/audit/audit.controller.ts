import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { auditService } from '@services/audit/audit.service';
import { auditMapper } from '@mappers/audit.mapper';
import { AppError } from '@utils/errors';
import { UserRole } from '@CustomTypes/common.types';

export class AuditController {
  list = catchAsync(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        403,
        'Acceso denegado a registros de auditoría'
      );
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await auditService.listLogs(page, limit, {
      userId: req.query.userId as string,
      entityType: req.query.entityType as string,
      action: req.query.action as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });

    return ApiResponse.success(res, {
      ...result,
      items: auditMapper.toDTOList(result.items),
    });
  });
}

export const auditController = new AuditController();
