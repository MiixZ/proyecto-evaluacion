import { Router } from 'express';
import { courseController } from '@controllers/course/course.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createCourseRequest,
  updateCourseRequest,
  getCourseRequest,
  listCoursesRequest,
} from '@validators/course.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createCourseRequest), courseController.create);
router.get('/:id', validateRequest(getCourseRequest), courseController.getById);
router.patch(
  '/:id',
  validateRequest(updateCourseRequest),
  courseController.update
);
router.get('/', validateRequest(listCoursesRequest), courseController.list);

export default router;
