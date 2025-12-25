import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import {
  userService,
  LoginRequest,
  RegisterRequest,
} from '@services/user/userService';
import { AppError, AuthenticationError } from '@utils/errors';

const router = Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 *
 * Body:
 * {
 *   "email": "usuario@example.com",
 *   "password": "SecurePass123!",
 *   "firstName": "Juan",
 *   "lastName": "Pérez"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, email, firstName, lastName, role, status },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   },
 *   "timestamp": "2025-12-25T..."
 * }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      bio,
      profileImageUrl,
    } = req.body;

    // Validar datos
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'Faltan campos requeridos: email, password, firstName, lastName',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email inválido',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La contraseña debe tener al menos 8 caracteres',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Registrar usuario
    const request: RegisterRequest = {
      email,
      password,
      firstName,
      lastName,
      phone,
      bio,
      profileImageUrl,
    };
    const result = await userService.register(request);

    logger.info('Usuario registrado exitosamente', { email });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn('Error de autenticación en registro', {
        message: error.message,
      });
      return res.status(409).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof AppError) {
      logger.error('Error de aplicación en registro', error);
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: 'APP_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.error('Error inesperado en registro', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve JWT
 *
 * Body:
 * {
 *   "email": "usuario@example.com",
 *   "password": "SecurePass123!"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, email, firstName, lastName, role, status },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   },
 *   "timestamp": "2025-12-25T..."
 * }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar datos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Faltan campos requeridos: email, password',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Autenticar usuario
    const request: LoginRequest = { email, password };
    const result = await userService.login(request);

    logger.info('Usuario autenticado exitosamente', { email });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn('Error de autenticación en login', {
        message: error.message,
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof AppError) {
      logger.error('Error de aplicación en login', error);
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: 'APP_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.error('Error inesperado en login', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
