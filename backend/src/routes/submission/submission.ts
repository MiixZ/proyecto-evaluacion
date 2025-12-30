import { Router } from 'express';
import { submissionController } from '@controllers/submission/submission.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import { submitRouteSchema } from '@validators/submission.validator';

const router = Router();

router.use(authMiddleware);

/**
 * POST /api/v1/submissions
 */
router.post(
  '/',
  validateRequest(submitRouteSchema),
  submissionController.submitCode
);

export default router;
