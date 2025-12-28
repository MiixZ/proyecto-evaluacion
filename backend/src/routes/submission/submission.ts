import { Router } from 'express';
import { submissionController } from '@controllers/submission/submission.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * POST /api/v1/submissions
 * Body: { exerciseId, courseId, code, language }
 */
router.post('/', submissionController.submitCode);

export default router;
