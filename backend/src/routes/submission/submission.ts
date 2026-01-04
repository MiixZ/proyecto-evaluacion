import { Router } from 'express';
import { submissionController } from '@controllers/submission/submission.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  getSubmissionSchema,
  submitRouteSchema,
} from '@validators/submission.validator';

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

router.get(
  '/:id',
  validateRequest(getSubmissionSchema),
  submissionController.getById
);

/**
 * GET /api/v1/submissions
 */
router.get('/', submissionController.getHistory);

export default router;
