import { Router } from 'express';
import { dashboardController } from '@controllers/dashboard/dashboard.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/my-progress', dashboardController.getMyProgress);
router.get('/student/charts', dashboardController.getStudentCharts);
router.get('/student/streak', dashboardController.getLoginStreak);

router.get('/teacher/overview', dashboardController.getTeacherOverview);
router.get('/teacher/charts', dashboardController.getTeacherCharts);

router.get(
  '/teacher/group/:groupId/activity',
  dashboardController.getGroupActivity
);
router.get(
  '/teacher/group/:groupId/plagiarism',
  dashboardController.getGroupPlagiarism
);

router.get('/admin', dashboardController.getAdminOverview);
router.get('/admin/charts', dashboardController.getAdminCharts);
router.get('/academic-years', dashboardController.getAcademicYears);

// Analíticas
router.get('/analytics/exercises', dashboardController.getExerciseAnalytics);
router.get('/analytics/plagiarism', dashboardController.getPlagiarismAnalytics);

export default router;
