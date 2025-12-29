import { Router } from 'express';
import { plagiarismController } from '@controllers/plagiarism/plagiarism.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createPlagiarismCheckRequest,
  reviewPlagiarismRequest,
  getBySubmissionRequest,
  listPlagiarismRequest,
} from '@validators/plagiarism.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createPlagiarismCheckRequest),
  plagiarismController.create
);
router.get(
  '/submission/:submissionId',
  validateRequest(getBySubmissionRequest),
  plagiarismController.getBySubmission
);
router.patch(
  '/:id/review',
  validateRequest(reviewPlagiarismRequest),
  plagiarismController.review
);
router.get(
  '/',
  validateRequest(listPlagiarismRequest),
  plagiarismController.list
);

export default router;
