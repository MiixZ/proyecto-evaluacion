import { Router } from 'express';
import { syllabusController } from '@controllers/syllabus/syllabus.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createSyllabusRequest,
  updateSyllabusRequest,
} from '@validators/syllabus.validator';
import { uuidSchema } from '@validators/common.validator';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

router.get('/', syllabusController.list);

router.post(
  '/',
  validateRequest(createSyllabusRequest),
  syllabusController.create
);

router.patch(
  '/:id',
  validateRequest(updateSyllabusRequest),
  syllabusController.update
);

router.patch(
  '/:id/visibility',
  validateRequest(z.object({ params: z.object({ id: uuidSchema }) })),
  syllabusController.toggleVisibility
);

router.get(
  '/course/:courseId',
  validateRequest(z.object({ params: z.object({ courseId: uuidSchema }) })),
  syllabusController.listByCourse
);

export default router;
