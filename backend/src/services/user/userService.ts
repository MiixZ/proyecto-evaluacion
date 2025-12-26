import bcrypt from 'bcrypt';
import { logger } from '@utils/logger';
import { AuthenticationError, AppError, NotFoundError } from '@utils/errors';
import { generateToken } from '@utils/jwt.utils';
import { userModel } from '@models/user/user.model';
import { UserDTO } from '@models/user/user.entity';
import { UserStatus, UUID } from '@CustomTypes/common.types';

/**
 * Interfaz de usuario
 */
export interface User extends UserDTO {}

/**
 * Request de login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request para crear un usuario
 */
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  phone?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  preferredLanguage?: 'es' | 'en';
}

/**
 * Response de autenticación (login)
 */
export interface AuthResponse {
  success: true;
  data: {
    user: User;
    token: string;
  };
  timestamp: string;
}

/**
 * Servicio de usuarios
 * Maneja autenticación y gestión de usuarios
 * NOTA: El registro de usuarios se realiza única y exclusivamente por la interfaz (panel de administrador)
 */
export class UserService {
  /**
   * Compara una contraseña con su hash
   *
   * @param password - Contraseña en texto plano
   * @param hash - Hash de contraseña
   * @returns true si coinciden
   */
  private async comparePasswords(
    password: string,
    hash: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error comparando contraseñas', error);
      throw new AppError('COMPARE_ERROR', 500, 'Error comparando contraseñas');
    }
  }

  /**
   * Autentica un usuario (login)
   *
   * @param request - Datos de login
   * @returns Usuario autenticado y JWT con expiración de 3 horas
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = request;
      let userEntity;

      try {
        userEntity = await userModel.getByEmail(email);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new AuthenticationError('Credenciales inválidas');
        }
        throw error;
      }

      // Comparar contraseñas
      const isPasswordValid = await this.comparePasswords(
        password,
        userEntity.authId
      );
      if (!isPasswordValid) {
        logger.warn('Intento de login fallido', { email });
        throw new AuthenticationError('Credenciales inválidas');
      }

      if (userEntity.status !== UserStatus.ACTIVE) {
        throw new AuthenticationError(
          'Usuario desactivado o pendiente de activación'
        );
      }

      // Convertir a DTO
      const user: User = {
        id: userEntity.id,
        email: userEntity.email,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        role: userEntity.role,
        status: userEntity.status,
        phone: userEntity.phone,
        bio: userEntity.bio,
        profileImageUrl: userEntity.profileImageUrl,
        preferredLanguage: userEntity.preferredLanguage,
        createdAt: userEntity.createdAt,
      };

      logger.info('Usuario autenticado', {
        userId: user.id,
        email: user.email,
      });

      const token = generateToken(user.id, user.email, user.role);

      return {
        success: true,
        data: {
          user,
          token,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Error autenticando usuario', error);
      throw new AppError('AUTH_ERROR', 500, 'Error en autenticación');
    }
  }

  /**
   * Obtiene un usuario por email
   *
   * @param email - Email del usuario
   * @returns Usuario o null si no existe
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userEntity = await userModel.getByEmail(email);
      return {
        id: userEntity.id,
        email: userEntity.email,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        role: userEntity.role,
        status: userEntity.status,
        phone: userEntity.phone,
        bio: userEntity.bio,
        profileImageUrl: userEntity.profileImageUrl,
        preferredLanguage: userEntity.preferredLanguage,
        createdAt: userEntity.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   *
   * @param id - ID del usuario
   * @returns Usuario
   */
  async getUserById(id: string): Promise<User> {
    const userEntity = await userModel.getById(id as UUID);
    return {
      id: userEntity.id,
      email: userEntity.email,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      role: userEntity.role,
      status: userEntity.status,
      phone: userEntity.phone,
      bio: userEntity.bio,
      profileImageUrl: userEntity.profileImageUrl,
      preferredLanguage: userEntity.preferredLanguage,
      createdAt: userEntity.createdAt,
    };
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const newUserEntity = await userModel.create(
      {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as any,
        password: userData.password,
        phone: userData.phone,
        bio: userData.bio,
        profileImageUrl: userData.profileImageUrl,
        preferredLanguage: userData.preferredLanguage || 'es',
      },
      userData.password
    );

    return {
      id: newUserEntity.id,
      email: newUserEntity.email,
      firstName: newUserEntity.firstName,
      lastName: newUserEntity.lastName,
      role: newUserEntity.role,
      status: newUserEntity.status,
      phone: newUserEntity.phone,
      bio: newUserEntity.bio,
      profileImageUrl: newUserEntity.profileImageUrl,
      preferredLanguage: newUserEntity.preferredLanguage,
      createdAt: newUserEntity.createdAt,
    };
  }
}

// Exportar instancia
export const userService = new UserService();
