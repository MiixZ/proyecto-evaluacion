import { Response, NextFunction } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { AuthenticationError } from '@utils/errors';
import { logger } from '@utils/logger';
import { verifyToken, extractBearerToken } from '@utils/jwt.utils';
import { UserRole, UserStatus, UUID } from '@CustomTypes/common.types';

/**
 * Middleware para verificar y validar tokens JWT locales
 *
 * Uso:
 *   app.use('/api/v1', authMiddleware);
 *
 * Espera:
 *   Authorization: Bearer <token>
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // Extraer token del header
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new AuthenticationError('Token no proporcionado');
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.sub as UUID,
      email: decoded.email,
      role: decoded.role as UserRole,
      status: UserStatus.ACTIVE,
    };

    req.token = token;

    logger.debug('Usuario autenticado', {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
    });

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn('Error de autenticación', {
        message: error.message,
        path: req.path,
        method: req.method,
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.error('Error inesperado en authMiddleware', error);
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

/**
 * Middleware para validar roles de usuario
 * Sólo permite acceso a usuarios con roles especificados
 *
 * Uso:
 *   router.get('/admin-only', authMiddleware, roleCheckMiddleware(['admin']), handler);
 */
export function roleCheckMiddleware(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuario no autenticado');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthenticationError(
          `Acceso denegado. Roles requeridos: ${allowedRoles.join(', ')}`
        );
      }

      logger.debug('Rol verificado', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
      });

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
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

/**
 * Middleware para capturar y loguear errores
 * Debe ser el último middleware registrado
 *
 * Uso:
 *   app.use(errorHandlerMiddleware);
 */
export function errorHandlerMiddleware(
  error: Error,
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error no capturado', error);

  const appError = error as any;

  if (appError.statusCode) {
    res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
      code: appError.code,
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

/**
 * Middleware para loguear requests HTTP
 * Registra método, ruta, status y duración
 *
 * Uso:
 *   app.use(requestLoggerMiddleware);
 */
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

/**
 * Middleware para verificar si el usuario debe cambiar su contraseña
 * Permite acceso solo a la ruta de primer cambio de contraseña si el flag está activo
 *
 * Rutas exceptuadas:
 * - /api/v1/users/me/first-password-change (POST)
 * - /api/v1/auth/logout (POST)
 *
 * Uso:
 *   app.use('/api/v1', authMiddleware, requirePasswordChangeMiddleware);
 */
export async function requirePasswordChangeMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exemptRoutes = [
      { method: 'POST', path: '/users/me/first-password-change' },
      { method: 'POST', path: '/auth/logout' },
      { method: 'GET', path: '/users/profile/me' },
    ];

    const isExempt = exemptRoutes.some(
      (route) => route.method === req.method && route.path === req.path
    );

    if (isExempt) {
      return next();
    }

    if (!req.user) {
      return next();
    }

    const { userModel } = await import('@models/user/user.model');
    const user = await userModel.getById(req.user.id);

    if (!user) {
      return next();
    }

    if (user.mustChangePassword) {
      logger.warn('Usuario debe cambiar contraseña', {
        userId: user.id,
        email: user.email,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Debes cambiar tu contraseña antes de continuar',
          mustChangePassword: true,
        },
        timestamp: new Date().toISOString(),
      });

      return;
    }

    next();
  } catch (error) {
    logger.error('Error en requirePasswordChangeMiddleware', error);
    next();
  }
}
