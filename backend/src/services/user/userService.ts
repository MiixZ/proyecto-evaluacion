import { logger } from '@utils/logger';
import { userModel } from '@models/user/user.model';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  AppError,
} from '@utils/errors';
import { createUUID, UserRole, UserStatus } from '@CustomTypes/common.types';
import { UserDTO, UserEntity } from '@models/user/user.entity';
import { CreateUserInput, UpdateUserInput } from '@validators/schemas';

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
      phone?: string | null;
      bio?: string | null;
      profileImageUrl?: string | null;
      preferredLanguage?: 'es' | 'en';
    },
    authId: string
  ): Promise<UserDTO> {
    try {
      const exists = await userModel.existsByEmail(input.email);
      if (exists) {
        throw new ValidationError(`Usuario con email ${input.email} ya existe`);
      }

      const createInput: CreateUserInput = {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || UserRole.STUDENT,
        phone: input.phone || null,
        bio: input.bio || null,
        profileImageUrl: input.profileImageUrl || null,
        preferredLanguage: input.preferredLanguage || 'es',
      };

      const user: UserEntity = await userModel.create(createInput, authId);

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
      const user = await userModel.getById(createUUID(userId));
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
  async getUserByAuthId(authId: string): Promise<UserDTO | null> {
    try {
      const user = await userModel.getByAuthId(authId);
      if (!user) {
        return null;
      }
      return this.entityToDTO(user);
    } catch (error) {
      logger.error(`Error obteniendo usuario por authId:`, error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId: string, updates: UpdateUserInput): Promise<UserDTO> {
    try {
      // Verificar que existe
      const existing = await userModel.getById(createUUID(userId));
      if (!existing) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      if (updates.email && updates.email !== existing.email) {
        const duplicate = await userModel.getByEmail(updates.email);
        if (duplicate) {
          throw new ValidationError(`Email ${updates.email} ya está en uso`);
        }
      }

      const updated = await userModel.update(createUUID(userId), updates);
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
        requestingUser.role !== UserRole.ADMIN &&
        requestingUser.id !== userId
      ) {
        throw new ForbiddenError('Solo administradores pueden cambiar roles');
      }

      const user = await userModel.getById(createUUID(userId));
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      const updated = await userModel.updateRole(createUUID(userId), newRole);
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
      const user = await userModel.getById(createUUID(userId));
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      const updated = await userModel.updateStatus(
        createUUID(userId),
        newStatus
      );
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
      const user = await userModel.getById(createUUID(userId));
      if (!user) {
        throw new NotFoundError(`Usuario ${userId} no encontrado`);
      }

      if (user.deletedAt) {
        throw new ValidationError(`Usuario ${userId} ya fue eliminado`);
      }

      await userModel.softDelete(createUUID(userId));
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
      search?: string;
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
      const result = await userModel.list(page, limit, filters);

      return {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
        totalPages: result.totalPages,
      };
    } catch (error) {
      logger.error('Error listando usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener profesores
   */
  async getTeachers(): Promise<UserDTO[]> {
    try {
      const teachers = await userModel.getTeachers();
      return teachers;
    } catch (error) {
      logger.error('Error obteniendo profesores:', error);
      throw error;
    }
  }

  /**
   * Obtener estudiantes
   */
  async getStudents(): Promise<UserDTO[]> {
    try {
      const students = await userModel.getStudents();
      return students;
    } catch (error) {
      logger.error('Error obteniendo estudiantes:', error);
      throw error;
    }
  }

  /**
   * Convertir entidad a DTO (excluye datos sensibles)
   */
  private entityToDTO(user: UserEntity): UserDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();
