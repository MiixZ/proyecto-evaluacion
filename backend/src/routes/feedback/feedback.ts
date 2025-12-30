import { Router } from 'express';
import { feedbackController } from '@controllers/feedback/feedback.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createFeedbackRequest,
  updateFeedbackRequest,
  getFeedbackBySubmissionRequest,
} from '@validators/feedback.validator';
import { uuidSchema } from '@validators/common.validator';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createFeedbackRequest),
  feedbackController.create
);
router.get(
  '/submission/:submissionId',
  validateRequest(getFeedbackBySubmissionRequest),
  feedbackController.getBySubmission
);
router.patch(
  '/:id',
  validateRequest(updateFeedbackRequest),
  feedbackController.update
);
router.delete(
  '/:id',
  validateRequest(z.object({ params: z.object({ id: uuidSchema }) })),
  feedbackController.delete
);

export default router;
