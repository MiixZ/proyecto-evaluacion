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

    const [workload, groups] = await Promise.all([
      dashboardModel.getTeacherWorkload(teacherId as UUID),
      dashboardModel.getGroupStatistics(
        req.user?.role === UserRole.ADMIN ? undefined : (teacherId as UUID)
      ),
    ]);

    const totalStudents = groups.reduce(
      (acc, curr) => acc + curr.student_count,
      0
    );
    const totalActiveExercises = groups.reduce(
      (acc, curr) => acc + curr.exercise_count,
      0
    );

    const avgCompletion =
      groups.length > 0
        ? groups.reduce((acc, curr) => acc + curr.completion_percentage, 0) /
          groups.length
        : 0;

    return ApiResponse.success(res, {
      stats: {
        totalStudents,
        totalGroups: groups.length,
        activeExercises: totalActiveExercises,
        avgCompletion: Math.round(avgCompletion * 100) / 100,
        pendingEvaluation: workload?.pending_evaluation || 0,
        pendingFeedback: workload?.pending_feedback || 0,
      },
      workload: workload
        ? dashboardMapper.toTeacherWorkloadDTO(workload)
        : null,
      groups: groups.map(dashboardMapper.toGroupStatsDTO),
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
