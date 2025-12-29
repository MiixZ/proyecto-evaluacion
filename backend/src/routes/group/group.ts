import { Router } from 'express';
import { groupController } from '@controllers/group/group.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createGroupRequest,
  enrollMemberRequest,
  getGroupRequest,
} from '@validators/group.validator';
import { uuidSchema } from '@validators/common.validator';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createGroupRequest), groupController.create);
router.get('/:id', validateRequest(getGroupRequest), groupController.getById);
router.get(
  '/course/:courseId',
  validateRequest(z.object({ params: z.object({ courseId: uuidSchema }) })),
  groupController.listByCourse
);

router.post(
  '/:id/members',
  validateRequest(enrollMemberRequest),
  groupController.enrollMember
);
router.get(
  '/:id/members',
  validateRequest(getGroupRequest),
  groupController.getMembers
);
router.delete(
  '/:id/members/:userId',
  validateRequest(
    z.object({ params: z.object({ id: uuidSchema, userId: uuidSchema }) })
  ),
  groupController.removeMember
);

export default router;
