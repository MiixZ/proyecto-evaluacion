import { Router } from 'express';
import { dashboardController } from '@controllers/dashboard/dashboard.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/my-progress', dashboardController.getMyProgress);

router.get('/teacher/overview', dashboardController.getTeacherOverview);

router.get(
  '/teacher/group/:groupId/activity',
  dashboardController.getGroupActivity
);
router.get(
  '/teacher/group/:groupId/plagiarism',
  dashboardController.getGroupPlagiarism
);

router.get('/admin', dashboardController.getAdminOverview);

// Analíticas
router.get('/analytics/exercises', dashboardController.getExerciseAnalytics);
router.get('/analytics/plagiarism', dashboardController.getPlagiarismAnalytics);

export default router;
