import { Response, NextFunction } from 'express';
import { AuthRequest } from '@CustomTypes/request.types';
import { AuthenticationError } from '@utils/errors';
import { logger } from '@utils/logger';
import { authgearService } from '@services/auth/authgearService';

/**
 * Middleware mejorado para verificar y validar tokens JWT de Authgear
 * Valida contra JWKS y sincroniza usuario con BD local
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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token no proporcionado');
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw new AuthenticationError('Token vacío');
    }

    // Verificar token contra Authgear + sincronizar usuario
    const user = await authgearService.verifyToken(token);

    // Asignar usuario y token al request
    req.user = user;
    req.token = token;

    logger.debug('Usuario autenticado', {
      userId: user.id,
      email: user.email,
      role: user.role,
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
 *   router.get('/admin-only', roleCheckMiddleware(['admin']), handler);
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
      error: {
        code: appError.code || 'INTERNAL_ERROR',
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
 * Middleware opcional para validar API Key
 * Útel si usas API keys adicionales además de JWT
 *
 * Uso:
 *   app.use(apiKeyMiddleware);
 */
export function apiKeyMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Por ahora, saltamos este middleware
  // Puede implementarse si se desea validación adicional con API keys
  next();
}

/**
 * Middleware para limpiar cache de token al logout
 * Se usa en rutas de logout
 *
 * Uso:
 *   router.post('/logout', logoutMiddleware, handler);
 */
export function logoutMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (req.token) {
      // Invalida token del cache de Authgear
      authgearService.invalidateTokenCache(req.token);
      logger.info('Token invalidado en cache', { userId: req.user?.id });
    }
    next();
  } catch (error) {
    logger.error('Error en logoutMiddleware', error);
    next();
  }
}
