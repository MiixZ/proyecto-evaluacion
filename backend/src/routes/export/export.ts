import { Router } from 'express';
import { exportController } from '@controllers/export/export.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createExportRequest,
  getExportRequest,
  listExportsRequest,
} from '@validators/export.validator';

const router = Router();

router.use(authMiddleware);

// Ruta para exportar estadísticas completas de un grupo (debe ir ANTES de /:id)
router.get(
  '/group/:groupId/statistics',
  exportController.exportGroupStatistics
);

router.post('/', validateRequest(createExportRequest), exportController.create);
router.get('/:id', validateRequest(getExportRequest), exportController.getById);
router.get('/', validateRequest(listExportsRequest), exportController.list);

export default router;
