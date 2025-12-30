import { Router } from 'express';
import { languageController } from '@controllers/language/language.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', languageController.list);

export default router;
