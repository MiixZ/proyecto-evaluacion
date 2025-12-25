import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';
import { AuthenticationError, AppError } from '@utils/errors';
import { generateToken } from '@utils/jwt.utils';

/**
 * Interfaz de usuario (lo que devolvemos)
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz de usuario en BD (con password hasheada)
 */
export interface UserDB extends User {
  id_auth: string; // Password hasheada
}

/**
 * Request de registro
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
   * Este método será llamado desde el controlador (frontend en futuro)
   *
   * @param request - Datos de registro
   * @returns Usuario creado y JWT
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, password, firstName, lastName } = request;

      // Validar que no exista el usuario
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new AuthenticationError('El usuario ya existe');
      }

      // Hashear contraseña
      const hashedPassword = await this.hashPassword(password);

      // Crear usuario en BD
      const userId = uuidv4();
      const now = new Date();

      // Aquí irá la llamada a la BD
      // Por ahora, es un stub que necesita userModel implementado
      const user: User = {
        id: userId,
        email,
        firstName,
        lastName,
        role: 'student', // Default role
        status: 'active',
        createdAt: now,
        updatedAt: now,
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

      // Buscar usuario
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      // Obtener password hasheada de BD
      const userDB = await this.getUserDBByEmail(email);
      if (!userDB) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      // Comparar contraseñas
      const isPasswordValid = await this.comparePasswords(password, userDB.id_auth);
      if (!isPasswordValid) {
        logger.warn('Intento de login fallido', { email });
        throw new AuthenticationError('Credenciales inválidas');
      }

      // Validar que el usuario esté activo
      if (user.status !== 'active') {
        throw new AuthenticationError('Usuario desactivado');
      }

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
   * STUB: Implementar con userModel cuando esté listo
   */
  async getUserByEmail(email: string): Promise<User | null> {
    // TODO: Implementar con userModel
    return null;
  }

  /**
   * Obtiene usuario BD (con password) por email
   * STUB: Implementar con userModel cuando esté listo
   */
  async getUserDBByEmail(email: string): Promise<UserDB | null> {
    // TODO: Implementar con userModel
    return null;
  }
}

// Exportar instancia
export const userService = new UserService();
