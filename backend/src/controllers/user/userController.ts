import { Request, Response } from 'express';
import { logger } from '@utils/logger';
import { userService } from '@services/user/userService';
import { AuthRequest } from '@CustomTypes/request.types';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '@utils/errors';

/**
 * Controller para manejo de usuarios
 * Intermedia entre rutas y servicios
 */
export class UserController {
  /**
   * POST /api/v1/users
   * Crear un nuevo usuario
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        firstName,
        lastName,
        role,
        phone,
        bio,
        profileImageUrl,
        preferredLanguage,
      } = req.body;

      // Validación básica
      if (!email || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'email, firstName y lastName son requeridos',
          timestamp: new Date().toISOString(),
        });

        return;
      }

      // Crear usuario
      const authId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = await userService.createUser(
        {
          email,
          firstName,
          lastName,
          role,
          phone,
          bio,
          profileImageUrl,
          preferredLanguage,
        },
        authId
      );

      logger.info(`Usuario creado vía API: ${user.id}`);

      res.status(201).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error completo:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
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

      const result = await userService.listUsers(page, limit, {
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
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await userService.updateUser(id, updates);

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

      if (!role) {
        res.status(400).json({
          success: false,
          error: 'role es requerido',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userService.changeUserRole(id, role, req.user);

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
   * Cambiar estado de usuario
   */
  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'status es requerido',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userService.changeUserStatus(id, status);

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
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await userService.softDeleteUser(id);

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
  async getTeachers(req: Request, res: Response): Promise<void> {
    try {
      const teachers = await userService.getTeachers();

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
  async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const students = await userService.getStudents();

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
    if (error instanceof ValidationError) {
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
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof AppError) {
      res.status(400).json({
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
