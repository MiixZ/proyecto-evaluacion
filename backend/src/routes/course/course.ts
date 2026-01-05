import { Router } from 'express';
import { courseController } from '@controllers/course/course.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createCourseRequest,
  updateCourseRequest,
  getCourseRequest,
  listCoursesRequest,
  getMigrationPreviewRequest,
  getCourseHistoryRequest,
  migrateContentRequest,
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

// Rutas de migración
router.get(
  '/:sourceCourseId/migration-preview',
  validateRequest(getMigrationPreviewRequest),
  courseController.getMigrationPreview
);
router.get(
  '/subject/:subjectId/history',
  validateRequest(getCourseHistoryRequest),
  courseController.getCourseHistory
);
router.post(
  '/:sourceCourseId/migrate',
  validateRequest(migrateContentRequest),
  courseController.migrateContent
);

export default router;
