import { Router } from 'express';
import { submissionErrorController } from '@controllers/catalog/submission-error.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', submissionErrorController.list);

export default router;
