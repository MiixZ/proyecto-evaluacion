import { Router } from 'express';
import { dashboardController } from '@controllers/dashboard/dashboard.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/student/progress', dashboardController.getMyProgress);
router.get('/teacher/overview', dashboardController.getTeacherOverview);
router.get('/analytics/exercises', dashboardController.getExerciseAnalytics);
router.get('/analytics/plagiarism', dashboardController.getPlagiarismAnalytics);

export default router;
