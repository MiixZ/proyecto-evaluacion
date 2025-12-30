import { Router } from 'express';
import { authController } from '@controllers/auth/auth.controller';
import { validateRequest } from '@middleware/validator.middleware';
import { loginRequest } from '@validators/auth.validator';

const router = Router();

router.post('/login', validateRequest(loginRequest), authController.login);

export default router;
