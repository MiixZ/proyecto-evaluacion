import { Request, Response } from 'express';
import { logger } from '@utils/logger';
import { userService } from '@services/user/userService';
import { userModel } from '@models/user/user.model';
import { AuthRequest } from '@CustomTypes/request.types';
import { UUID } from '@CustomTypes/common.types';
import {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from '@utils/errors';

/**
 * Controller para manejo de usuarios
 * Intermedia entre rutas y servicios
 */
export class UserController {
  /*
   * POST /api/v1/auth/createUser
   * Crear un nuevo usuario
   */
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Solo administradores pueden crear usuarios',
        timestamp: new Date().toISOString(),
      });

      return;
    }

    try {
      const {
        email,
        firstName,
        lastName,
        role,
        password,
        phone,
        bio,
        profileImageUrl,
        preferredLanguage,
      } = req.body;

      if (!email || !firstName || !lastName || !role || !password) {
        res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos',
          timestamp: new Date().toISOString(),
        });

        return;
      }

      const newUser = await userModel.create(
        {
          email,
          firstName,
          lastName,
          role,
          password,
          phone,
          bio,
          profileImageUrl,
          preferredLanguage,
        },
        password
      );

      logger.info(`Nuevo usuario creado: ${newUser.id} - ${newUser.email}`);

      res.status(201).json({
        success: true,
        data: newUser,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Autenticar usuario y obtener JWT
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validación básica
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'email y password son requeridos',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Llamar al servicio de login
      const response = await userService.login({
        email,
        password,
      });

      logger.info(`Usuario autenticado: ${response.data.user.email}`);

      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/users/me
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Obtener usuario por ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/users
   * Listar usuarios con paginación
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await userModel.list(page, limit, {
        role: role as any,
        status: status as any,
        search,
      });

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /api/v1/users/:id
   * Actualizar usuario
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verificar que el usuario esté autenticado y sea el propietario o admin
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para actualizar este usuario',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userModel.update(id as UUID, updates);

      logger.info(`Usuario actualizado: ${id}`);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /api/v1/users/:id/role
   * Cambiar rol de usuario (solo admin)
   */
  async changeRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validar que sea admin
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Solo administradores pueden cambiar roles',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!role) {
        res.status(400).json({
          success: false,
          error: 'role es requerido',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userModel.updateRole(id as UUID, role);

      logger.info(`Rol cambiado para usuario ${id}: ${role}`);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /api/v1/users/:id/status
   * Cambiar estado de usuario (solo admin)
   */
  async changeStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validar que sea admin
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Solo administradores pueden cambiar estados',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'status es requerido',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userModel.updateStatus(id as UUID, status);

      logger.info(`Estado cambiado para usuario ${id}: ${status}`);

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Soft delete (desactivar) usuario
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validar que sea admin o el propietario
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para eliminar este usuario',
          timestamp: new Date().toISOString(),
        });

        return;
      }

      await userModel.softDelete(id as UUID);

      logger.info(`Usuario desactivado: ${id}`);

      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/users/teachers
   * Listar profesores
   */
  async getTeachers(_req: Request, res: Response): Promise<void> {
    try {
      const teachers = await userModel.getTeachers();

      res.status(200).json({
        success: true,
        data: teachers,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/users/students
   * Listar estudiantes
   */
  async getStudents(_req: Request, res: Response): Promise<void> {
    try {
      const students = await userModel.getStudents();

      res.status(200).json({
        success: true,
        data: students,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Manejador centralizado de errores
   */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof AppError) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('Error inesperado en UserController:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const userController = new UserController();
