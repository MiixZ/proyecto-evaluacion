import { Router } from 'express';
import { rankingController } from '@controllers/ranking/ranking.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/v1/ranking - Obtener ranking con filtros
router.get('/', rankingController.getRanking);

// GET /api/v1/ranking/groups/:subjectId - Obtener grupos de una asignatura
router.get('/groups/:subjectId', rankingController.getSubjectGroups);

export default router;
