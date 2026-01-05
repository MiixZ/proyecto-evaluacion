import { Router } from 'express';
import { authController } from '@controllers/auth/auth.controller';
import { validateRequest } from '@middleware/validator.middleware';
import { loginRequest } from '@validators/auth.validator';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/login', validateRequest(loginRequest), authController.login);

router.get('/me', authMiddleware, authController.getMe);

export default router;
