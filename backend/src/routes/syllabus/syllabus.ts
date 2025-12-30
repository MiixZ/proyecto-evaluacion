import { Router } from 'express';
import { syllabusController } from '@controllers/syllabus/syllabus.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import { createSyllabusRequest } from '@validators/syllabus.validator';
import { uuidSchema } from '@validators/common.validator';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createSyllabusRequest),
  syllabusController.create
);

router.get(
  '/course/:courseId',
  validateRequest(z.object({ params: z.object({ courseId: uuidSchema }) })),
  syllabusController.listByCourse
);

export default router;
