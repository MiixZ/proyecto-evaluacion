import { Router } from 'express';
import { groupController } from '@controllers/group/group.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createGroupRequest,
  getGroupRequest,
} from '@validators/group.validator';
import { updateGroupRequest } from '@validators/group.validator';
import { uuidSchema } from '@validators/common.validator';
import { z } from 'zod';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/', validateRequest(createGroupRequest), groupController.create);
router.get('/:id', validateRequest(getGroupRequest), groupController.getById);
router.patch(
  '/:id',
  validateRequest(updateGroupRequest),
  groupController.update
);
router.get(
  '/course/:courseId',
  validateRequest(z.object({ params: z.object({ courseId: uuidSchema }) })),
  groupController.listByCourse
);
router.get('/:groupId/students', groupController.getGroupStudents);
router.get(
  '/:id/export',
  validateRequest(getGroupRequest),
  groupController.exportData
);

router.post(
  '/:groupId/students/import',
  upload.single('file'),
  groupController.importStudentsCsv
);
router.post('/:groupId/students', groupController.addStudent);

router.get(
  '/search/context',
  authMiddleware,
  groupController.listBySubjectAndYear
);

router.put('/:groupId/students/:studentId', groupController.updateStudent);
router.patch(
  '/:groupId/students/:studentId/status',
  groupController.toggleStudentStatus
);

router.delete('/:groupId/students/:studentId', groupController.removeStudent);

export default router;
