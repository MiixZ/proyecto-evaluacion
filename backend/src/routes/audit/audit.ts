import { Router } from 'express';
import { auditController } from '@controllers/audit/audit.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import { listAuditRequest } from '@validators/audit.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', validateRequest(listAuditRequest), auditController.list);

export default router;
