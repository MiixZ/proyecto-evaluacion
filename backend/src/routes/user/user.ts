import { Router } from 'express';
import { userController } from '@controllers/user/user.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  changeRoleRequest,
  changeStatusRequest,
  createUserRequest,
  listUsersRequest,
  updateUserRequest,
} from '@validators/user.validator';

const router = Router();

router.post(
  '/',
  authMiddleware,
  validateRequest(createUserRequest),
  userController.createUser
);

router.get(
  '/',
  authMiddleware,
  validateRequest(listUsersRequest),
  userController.listUsers
);

router.get('/teachers', userController.getTeachers);
router.get('/students', userController.getStudents);

router.get('/:id', authMiddleware, userController.getUserById);

router.patch(
  '/me',
  authMiddleware,
  validateRequest(updateUserRequest),
  userController.updateMe
);

router.get('/me', userController.getMe);

router.patch(
  '/:id/role',
  authMiddleware,
  validateRequest(changeRoleRequest),
  userController.changeRole
);

router.patch(
  '/:id/status',
  authMiddleware,
  validateRequest(changeStatusRequest),
  userController.changeStatus
);

router.delete('/:id', authMiddleware, userController.deleteUser);

export default router;
