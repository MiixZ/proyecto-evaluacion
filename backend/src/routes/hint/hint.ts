import { Router } from 'express';
import { hintController } from '@controllers/hint/hint.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import { requestHintRequest } from '@validators/hint.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/:submissionId/test-case/:testCaseId',
  validateRequest(requestHintRequest),
  hintController.requestHint
);

export default router;
