import { logger } from '@utils/logger';
import { userModel } from '@models/user/user.model';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  AppError,
} from '@utils/errors';
import { UserDTO, UserRole, UserStatus, User } from '@types/common.types';
import crypto from 'crypto';

/**
 * Servicio de lógica de negocio para usuarios
 * Intermedia entre controllers y models
 */
export class UserService {
  /**
   * Crear un nuevo usuario
   */
  async createUser(
    input: {
      email: string;
      firstName: string;
      lastName: string;
      password?: string;
      role?: UserRole;
    },
    authId: string
  ): Promise<UserDTO> {
    try {
      // Validar que email no exista
      const existingUser = await userModel.getByEmail(input.email);
      if (existingUser) {
        throw new ValidationError(`Usuario con email ${input.email} ya existe`);
      }

      // Crear usuario
      const user = await userModel.create(
        {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role || 'student',
          status: 'active',
        },
        authId
      );

      logger.info(`Usuario creado: ${user.id} (${user.email})`);

      return this.entityToDTO(user);
    } catch (error) {
      logger.error('Error creando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<UserDTO> {
    try {
      const user = await userModel.getById(userId);
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }
      return this.entityToDTO(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error obteniendo usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<UserDTO> {
    try {
      const user = await userModel.getByEmail(email);
      if (!user) {
        throw new NotFoundError(`Usuario con email ${email} no encontrado`);
      }
      return this.entityToDTO(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error obteniendo usuario por email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Obtener usuario por authId (Authgear)
   */
  async getUserByAuthId(authId: string): Promise<UserDTO> {
    try {
      const user = await userModel.getByAuthId(authId);
      if (!user) {
        throw new NotFoundError(`Usuario con authId ${authId} no encontrado`);
      }
      return this.entityToDTO(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error obteniendo usuario por authId:`, error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      status?: UserStatus;
    }
  ): Promise<UserDTO> {
    try {
      // Verificar que existe
      const existing = await userModel.getById(userId);
      if (!existing) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      // Si cambia email, verificar que no existe otro
      if (updates.email && updates.email !== existing.email) {
        const duplicate = await userModel.getByEmail(updates.email);
        if (duplicate) {
          throw new ValidationError(
            `Email ${updates.email} ya está en uso`
          );
        }
      }

      const updated = await userModel.update(userId, updates);
      logger.info(`Usuario actualizado: ${userId}`);

      return this.entityToDTO(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error actualizando usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cambiar rol de usuario
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole,
    requestingUser?: { id: string; role: UserRole }
  ): Promise<UserDTO> {
    try {
      // Verificar permisos: solo admin puede cambiar roles
      if (
        requestingUser &&
        requestingUser.role !== 'admin' &&
        requestingUser.id !== userId
      ) {
        throw new ForbiddenError(
          'Solo administradores pueden cambiar roles'
        );
      }

      const user = await userModel.getById(userId);
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      const updated = await userModel.updateRole(userId, newRole);
      logger.info(`Rol actualizado para usuario ${userId}: ${newRole}`);

      return this.entityToDTO(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error cambiando rol del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cambiar estado de usuario
   */
  async changeUserStatus(
    userId: string,
    newStatus: UserStatus
  ): Promise<UserDTO> {
    try {
      const user = await userModel.getById(userId);
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      const updated = await userModel.updateStatus(userId, newStatus);
      logger.info(`Estado actualizado para usuario ${userId}: ${newStatus}`);

      return this.entityToDTO(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error cambiando estado del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete (desactivar) usuario
   */
  async softDeleteUser(userId: string): Promise<void> {
    try {
      const user = await userModel.getById(userId);
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      if (user.deletedAt) {
        throw new ValidationError(`Usuario ${userId} ya fue eliminado`);
      }

      await userModel.softDelete(userId);
      logger.info(`Usuario desactivado (soft delete): ${userId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error desactivando usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Listar usuarios con paginación
   */
  async listUsers(
    page: number = 1,
    limit: number = 10,
    filters?: {
      role?: UserRole;
      status?: UserStatus;
    }
  ): Promise<{
    items: UserDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    totalPages: number;
  }> {
    try {
      const result = await userModel.list(page, limit);

      // Aplicar filtros si se proporcionan
      let filtered = result.items;
      if (filters) {
        if (filters.role) {
          filtered = filtered.filter((u) => u.role === filters.role);
        }
        if (filters.status) {
          filtered = filtered.filter((u) => u.status === filters.status);
        }
      }

      return {
        items: filtered.map((u) => this.entityToDTO(u)),
        total: result.total,
        page,
        limit,
        hasMore: result.hasMore,
        totalPages: Math.ceil(result.total / limit),
      };
    } catch (error) {
      logger.error('Error listando usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener profesores
   */
  async getTeachers(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    items: UserDTO[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const result = await userModel.getTeachers(page, limit);
      return {
        items: result.items.map((u) => this.entityToDTO(u)),
        total: result.total,
        hasMore: result.hasMore,
      };
    } catch (error) {
      logger.error('Error obteniendo profesores:', error);
      throw error;
    }
  }

  /**
   * Obtener estudiantes
   */
  async getStudents(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    items: UserDTO[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const result = await userModel.getStudents(page, limit);
      return {
        items: result.items.map((u) => this.entityToDTO(u)),
        total: result.total,
        hasMore: result.hasMore,
      };
    } catch (error) {
      logger.error('Error obteniendo estudiantes:', error);
      throw error;
    }
  }

  /**
   * Convertir entidad a DTO (excluye datos sensibles)
   */
  private entityToDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}

export const userService = new UserService();
