import { Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { AuthRequest } from '@CustomTypes/request.types.js';
import { AuthUser, UserRole } from '@CustomTypes/common.types.js';
import { AppError, AuthenticationError } from '@utils/errors.js';
import { logger } from '@utils/logger.js';
import config from '@config/environment.js';

interface AuthgearUser {
  sub: string;
  email: string;
  email_verified: boolean;
  custom_attributes?: {
    role?: UserRole;
  };
}

/**
 * Middleware para verificar y decodificar el token JWT
 * Espera un token en el header: Authorization: Bearer <token>
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token no proporcionado');
    }

    const token = authHeader.slice(7);
    req.token = token;

    const user = await verifyTokenWithAuthgear(token);
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('Error en authMiddleware', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token inválido o expirado',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export function roleCheckMiddleware(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthenticationError(
          `Rol requerido: ${allowedRoles.join(', ')}, pero tienes: ${req.user.role}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'No autorizado',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  };
}

async function verifyTokenWithAuthgear(token: string): Promise<AuthUser> {
  try {
    // En este punto, simplemente decodificaremos el token y lo verificaremos básicamente
    // Idealmente, se debería usar la API de Authgear para verificación completa
    const response = await axios.post(
      `${config.authgear.endpoint}/oauth/userinfo`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const authgearUser: AuthgearUser = response.data;

    const role = authgearUser.custom_attributes?.role || UserRole.STUDENT;

    const user: AuthUser = {
      id: authgearUser.sub,
      authId: authgearUser.sub,
      email: authgearUser.email,
      role: role as UserRole,
    };

    return user;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Error verificando token con Authgear', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });
    throw new AuthenticationError('Token inválido o expirado');
  }
}

export function errorHandlerMiddleware(
  error: Error,
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error no capturado', error);

  const appError = error as AppError;

  if (appError.statusCode) {
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export function requestLoggerMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });
  });

  next();
}
