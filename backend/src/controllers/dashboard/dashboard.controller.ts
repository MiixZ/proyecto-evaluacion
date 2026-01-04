import { Response } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { catchAsync } from '@utils/async.handler';
import { ApiResponse } from '@utils/response.handler';
import { dashboardModel } from '@models/dashboard/dashboard.model';
import { dashboardMapper } from '@mappers/dashboard.mapper';
import { UserRole, UUID } from '@CustomTypes/common.types';
import { AppError } from '@utils/errors';

export class DashboardController {
  getMyProgress = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { courseId } = req.query;

    const rows = await dashboardModel.getStudentProgress(
      userId as UUID,
      courseId as UUID
    );

    return ApiResponse.success(
      res,
      rows.map(dashboardMapper.toStudentProgressDTO)
    );
  });

  getTeacherOverview = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'Acceso denegado');
    }

    const teacherId = req.user!.id;
    const requestedGroupId = req.query.groupId as UUID | undefined;

    const allGroups = await dashboardModel.getGroupStatistics(
      req.user?.role === UserRole.ADMIN ? undefined : (teacherId as UUID)
    );

    if (allGroups.length === 0) {
      return ApiResponse.success(res, {
        groups: [],
        activeGroup: null,
      });
    }

    const activeGroupId = requestedGroupId || (allGroups[0].group_id as UUID);
    const activeGroupInfo =
      allGroups.find((g) => g.group_id === activeGroupId) || allGroups[0];

    const [students, recentActivityData, plagiarismAlertsData] =
      await Promise.all([
        dashboardModel.getStudentsByGroup(activeGroupId),
        dashboardModel.getRecentActivityByGroup(activeGroupId, 1, 10),
        dashboardModel.getPlagiarismAlertsByGroup(activeGroupId, 1, 5),
      ]);

    return ApiResponse.success(res, {
      groups: allGroups.map(dashboardMapper.toGroupStatsDTO),
      activeGroup: {
        info: dashboardMapper.toGroupStatsDTO(activeGroupInfo),
        students: students.map(dashboardMapper.toGroupStudentDTO),
        recentActivity: recentActivityData.items.map(
          dashboardMapper.toRecentActivityDTO
        ),
        plagiarismAlerts: plagiarismAlertsData.items.map(
          dashboardMapper.toPlagiarismAlertDTO
        ),
      },
    });
  });

  getGroupActivity = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'Acceso denegado');
    }

    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { items, total } = await dashboardModel.getRecentActivityByGroup(
      groupId as UUID,
      page,
      limit
    );

    return ApiResponse.success(res, {
      items: items.map(dashboardMapper.toRecentActivityDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  });

  getGroupPlagiarism = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'Acceso denegado');
    }

    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { items, total } = await dashboardModel.getPlagiarismAlertsByGroup(
      groupId as UUID,
      page,
      limit
    );

    return ApiResponse.success(res, {
      items: items.map(dashboardMapper.toPlagiarismAlertDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  });

  getExerciseAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    if (
      req.user?.role !== UserRole.TEACHER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      throw new AppError('FORBIDDEN', 403, 'Acceso denegado');
    }

    const { courseId } = req.query;
    const metrics = await dashboardModel.getExerciseMetrics(courseId as UUID);

    return ApiResponse.success(
      res,
      metrics.map(dashboardMapper.toExerciseMetricsDTO)
    );
  });

  getPlagiarismAnalytics = catchAsync(
    async (req: AuthRequest, res: Response) => {
      if (
        req.user?.role !== UserRole.TEACHER &&
        req.user?.role !== UserRole.ADMIN
      ) {
        throw new AppError('FORBIDDEN', 403, 'Acceso denegado');
      }

      const { courseId } = req.query;
      const summary = await dashboardModel.getPlagiarismSummary(
        courseId as UUID
      );

      return ApiResponse.success(
        res,
        summary.map(dashboardMapper.toPlagiarismSummaryDTO)
      );
    }
  );
}

export const dashboardController = new DashboardController();
