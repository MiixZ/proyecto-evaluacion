import { Router } from 'express';
import { exerciseController } from '@controllers/exercise/exercise.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createExerciseRequest,
  getExerciseRequest,
  getExercisesBySyllabusRequest,
} from '@validators/exercise.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createExerciseRequest),
  exerciseController.create
);

router.get(
  '/:id',
  validateRequest(getExerciseRequest),
  exerciseController.getById
);

router.get(
  '/syllabus/:syllabusId',
  validateRequest(getExercisesBySyllabusRequest),
  exerciseController.listBySyllabus
);

router.get('/professor/mine', exerciseController.getMyExercises);
router.patch('/:id/publish', exerciseController.togglePublish);
router.post('/:id/clone', exerciseController.clone);
router.put(
  '/:id',
  validateRequest(createExerciseRequest),
  exerciseController.update
);

export default router;
