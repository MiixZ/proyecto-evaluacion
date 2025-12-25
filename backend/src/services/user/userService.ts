import bcrypt from 'bcrypt';
import { logger } from '@utils/logger';
import { AuthenticationError, AppError, NotFoundError } from '@utils/errors';
import { generateToken } from '@utils/jwt.utils';
import { userModel } from '@models/user/user.model';
import { UserDTO } from '@models/user/user.entity';
import { CreateUserInput, validate, createUserSchema } from '@validators/schemas';

/**
 * Interfaz de usuario (lo que devolvemos)
 */
export interface User extends UserDTO {
  // Heredar de UserDTO que tiene: id, email, firstName, lastName, role, status, createdAt
}

/**
 * Request de registro
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'teacher' | 'student';
}

/**
 * Request de login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response de autenticación (login/register)
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
 * Maneja creación, autenticación y gestión de usuarios
 */
export class UserService {
  /**
   * Hashea una contraseña con bcrypt
   *
   * @param password - Contraseña en texto plano
   * @returns Contraseña hasheada
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      logger.error('Error hasheando contraseña', error);
      throw new AppError('Error procesando contraseña', 500);
    }
  }

  /**
   * Compara una contraseña con su hash
   *
   * @param password - Contraseña en texto plano
   * @param hash - Hash de contraseña
   * @returns true si coinciden
   */
  private async comparePasswords(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error comparando contraseñas', error);
      return false;
    }
  }

  /**
   * Registra un nuevo usuario
   * Este método será llamado desde el controlador
   *
   * @param request - Datos de registro
   * @returns Usuario creado y JWT
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, password, firstName, lastName, role = 'student' } = request;

      // Validar que no exista el usuario
      const exists = await userModel.existsByEmail(email);
      if (exists) {
        throw new AuthenticationError('El email ya está registrado');
      }

      // Hashear contraseña
      const passwordHash = await this.hashPassword(password);

      // Preparar input validado
      const createUserInput: CreateUserInput = validate(createUserSchema, {
        email,
        password,
        firstName,
        lastName,
        role,
      });

      // Crear usuario en BD
      // userModel.create() espera: (input, authId, passwordHash)
      const userEntity = await userModel.create(
        {
          email: createUserInput.email,
          firstName: createUserInput.firstName,
          lastName: createUserInput.lastName,
          role: createUserInput.role,
          phone: createUserInput.phone,
          bio: createUserInput.bio,
          profileImageUrl: createUserInput.profileImageUrl,
          preferredLanguage: createUserInput.preferredLanguage,
        },
        `local_${createUserInput.email}`, // authId para JWT local
        passwordHash
      );

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

      logger.info('Usuario registrado', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Generar JWT
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
      logger.error('Error registrando usuario', error);
      throw new AppError('Error registrando usuario', 500);
    }
  }

  /**
   * Autentica un usuario (login)
   *
   * @param request - Datos de login
   * @returns Usuario autenticado y JWT
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = request;

      // Buscar usuario en BD
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
        userEntity.passwordHash
      );
      if (!isPasswordValid) {
        logger.warn('Intento de login fallido', { email });
        throw new AuthenticationError('Credenciales inválidas');
      }

      // Validar que el usuario esté activo
      if (userEntity.status !== 'active') {
        throw new AuthenticationError('Usuario desactivado o pendiente de activación');
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

      // Generar JWT
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
      throw new AppError('Error en autenticación', 500);
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
    const userEntity = await userModel.getById(id);
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
}

// Exportar instancia
export const userService = new UserService();
