import { Router } from 'express';
import { degreeController } from '@controllers/degree/degree.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validator.middleware';
import {
  createDegreeRequest,
  updateDegreeRequest,
  getDegreeRequest,
  listDegreesRequest,
} from '@validators/degree.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createDegreeRequest), degreeController.create);
router.get('/:id', validateRequest(getDegreeRequest), degreeController.getById);
router.patch(
  '/:id',
  validateRequest(updateDegreeRequest),
  degreeController.update
);
router.get('/', validateRequest(listDegreesRequest), degreeController.list);

export default router;
