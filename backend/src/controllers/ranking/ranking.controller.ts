import { Request, Response, NextFunction } from 'express';
import { rankingService } from '@services/ranking/ranking.service';
import { catchAsync } from '@utils/async.handler';
import { UUID, UserRole } from '@CustomTypes/common.types';
import { AuthRequest } from '@CustomTypes/request.types';

export class RankingController {
  /**
   * GET /api/v1/ranking
   * Obtiene el ranking de estudiantes con filtros opcionales
   */
  getRanking = catchAsync(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const userId = req.user!.id as UUID;
      const userRole = req.user!.role as UserRole;
      const subjectId = req.query.subjectId as UUID | undefined;
      const groupId = req.query.groupId as UUID | undefined;

      const data = await rankingService.getRanking(
        userId,
        userRole,
        subjectId,
        groupId
      );

      res.json({
        success: true,
        data,
      });
    }
  );

  /**
   * GET /api/v1/ranking/groups/:subjectId
   * Obtiene los grupos de una asignatura específica
   */
  getSubjectGroups = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { subjectId } = req.params;

      const groups = await rankingService.getSubjectGroups(subjectId as UUID);

      res.json({
        success: true,
        data: groups,
      });
    }
  );
}

export const rankingController = new RankingController();
