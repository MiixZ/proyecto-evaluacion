import { Router } from 'express';
import { subjectController } from '@controllers/subject/subject.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createSubjectRequest,
  updateSubjectRequest,
  getSubjectRequest,
  listSubjectsRequest,
} from '@validators/subject.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createSubjectRequest),
  subjectController.create
);
router.get(
  '/:id',
  validateRequest(getSubjectRequest),
  subjectController.getById
);
router.patch(
  '/:id',
  validateRequest(updateSubjectRequest),
  subjectController.update
);
router.get('/', validateRequest(listSubjectsRequest), subjectController.list);

export default router;
