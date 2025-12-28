import { Router } from 'express';
import { exerciseController } from '@controllers/exercise/exercise.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import { createExerciseSchema } from '@validators/exercise.validator';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({ body: createExerciseSchema });
const publishSchema = z.object({
  body: z.object({ isPublished: z.boolean() }),
});

router.post('/', validateRequest(createSchema), exerciseController.create);
router.get('/:id', exerciseController.getById);

router.get('/syllabus/:syllabusId', exerciseController.listBySyllabus);

router.patch(
  '/:id/publish',
  validateRequest(publishSchema),
  exerciseController.togglePublish
);

export default router;
