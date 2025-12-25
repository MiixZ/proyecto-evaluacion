import { Router } from 'express';
import { userController } from '@controllers/user/userController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

/**
 * POST /api/v1/users
 * Crear un nuevo usuario
 * Acceso: Público (sería protegido con Authgear en producción)
 */
router.post('/', (req, res) => userController.createUser(req, res));

/**
 * GET /api/v1/users
 * Listar usuarios con paginación
 * Query params: page=1, limit=10, role=student, status=active
 * Acceso: Autenticado
 */
router.get('/', authMiddleware, (req, res) => userController.listUsers(req, res));

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
router.get('/:id', authMiddleware, (req, res) => userController.getUserById(req, res));

/**
 * PATCH /api/v1/users/:id
 * Actualizar usuario
 * Body: { firstName?, lastName?, email?, status? }
 * Acceso: Autenticado (su propio usuario o admin)
 */
router.patch('/:id', authMiddleware, (req, res) => userController.updateUser(req, res));

/**
 * PATCH /api/v1/users/:id/role
 * Cambiar rol de usuario
 * Body: { role: 'admin' | 'teacher' | 'student' }
 * Acceso: Admin only
 */
router.patch('/:id/role', authMiddleware, (req, res) => userController.changeRole(req, res));

/**
 * PATCH /api/v1/users/:id/status
 * Cambiar estado de usuario
 * Body: { status: 'active' | 'inactive' | 'suspended' }
 * Acceso: Admin only
 */
router.patch('/:id/status', authMiddleware, (req, res) => userController.changeStatus(req, res));

/**
 * DELETE /api/v1/users/:id
 * Soft delete (desactivar) usuario
 * Acceso: Autenticado (su propio usuario o admin)
 */
router.delete('/:id', authMiddleware, (req, res) => userController.deleteUser(req, res));

export default router;
