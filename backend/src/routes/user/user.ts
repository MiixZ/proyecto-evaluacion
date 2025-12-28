import { Router } from 'express';
import { userController } from '@controllers/user/userController';
import { authMiddleware } from '@middleware/auth.middleware';
import { createUserSchema, updateUserSchema } from '@validators/schemas';
import { z } from 'zod';
import { validateRequest } from '@middleware/validator.middleware';

const router = Router();

const createUserRequest = z.object({ body: createUserSchema });
const updateUserRequest = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: updateUserSchema,
});

/**
 * POST /api/v1/users
 * Crear un nuevo usuario
 * Acceso: Público
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(createUserRequest),
  userController.createUser
);

/**
 * GET /api/v1/users
 * Listar usuarios con paginación
 * Query params: page=1, limit=10, role=student, status=active
 * Acceso: Autenticado
 */
router.get('/', authMiddleware, userController.listUsers);

/**
 * GET /api/v1/users/teachers
 * Listar profesores
 * Query params: page=1, limit=10
 * Acceso: Público
 */
router.get('/teachers', (req, res) => userController.getTeachers(req, res));

/**
 * GET /api/v1/users/students
 * Listar estudiantes
 * Query params: page=1, limit=10
 * Acceso: Público
 */
router.get('/students', (req, res) => userController.getStudents(req, res));

/**
 * GET /api/v1/users/:id
 * Obtener usuario por ID
 * Acceso: Autenticado
 */
router.get('/:id', authMiddleware, (req, res) =>
  userController.getUserById(req, res)
);

/**
 * PATCH /api/v1/users/:id
 * Actualizar usuario
 * Body: { firstName?, lastName?, email?, status? }
 * Acceso: Autenticado (su propio usuario o admin)
 */
router.patch(
  '/:id',
  authMiddleware,
  validateRequest(updateUserRequest),
  userController.updateUser
);

/**
 * PATCH /api/v1/users/:id/role
 * Cambiar rol de usuario
 * Body: { role: 'admin' | 'teacher' | 'student' }
 * Acceso: Admin only
 */
router.patch('/:id/role', authMiddleware, (req, res) =>
  userController.changeRole(req, res)
);

/**
 * PATCH /api/v1/users/:id/status
 * Cambiar estado de usuario
 * Body: { status: 'active' | 'inactive' | 'suspended' }
 * Acceso: Admin only
 */
router.patch('/:id/status', authMiddleware, (req, res) =>
  userController.changeStatus(req, res)
);

/**
 * DELETE /api/v1/users/:id
 * Soft delete (desactivar) usuario
 * Acceso: Autenticado (su propio usuario o admin)
 */
router.delete('/:id', authMiddleware, userController.deleteUser);

export default router;
