import jwt from 'jsonwebtoken';
import config from '@config/environment';
import { logger } from '@utils/logger';
import { AuthenticationError } from '@utils/errors';

/**
 * Payload de un JWT de la aplicación
 */
export interface JWTPayload {
  sub: string;           // User ID
  email: string;
  role: string;
  iat: number;           // Issued at
  exp: number;           // Expires at
}

/**
 * Genera un JWT firmado para un usuario
 *
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @param role - Rol del usuario (admin, teacher, student)
 * @returns Token JWT firmado
 */
export function generateToken(
  userId: string,
  email: string,
  role: string
): string {
  try {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256',
    });

    logger.debug('Token generado', { userId, email, role });
    return token;
  } catch (error) {
    logger.error('Error generando token', error);
    throw new Error('No se pudo generar el token');
  }
}

/**
 * Verifica y decodifica un JWT
 *
 * @param token - Token JWT
 * @returns Payload decodificado
 * @throws AuthenticationError si el token es inválido o expiró
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expirado');
      throw new AuthenticationError('Token expirado');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token inválido', { message: error.message });
      throw new AuthenticationError('Token inválido');
    }

    logger.error('Error verificando token', error);
    throw new AuthenticationError('Error verificando token');
  }
}

/**
 * Decodifica un JWT sin verificar la firma
 * Útel: Sólo para extraer información, no para validación
 *
 * @param token - Token JWT
 * @returns Payload decodificado o null
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded;
  } catch (error) {
    logger.warn('Error decodificando token');
    return null;
  }
}

/**
 * Comprueba si un token ha expirado
 *
 * @param token - Token JWT
 * @returns true si está expirado
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const now = Date.now() / 1000; // Convertir a segundos
  return decoded.exp < now;
}

/**
 * Obtiene el tiempo de expiración de un token en segundos
 *
 * @param token - Token JWT
 * @returns Segundos hasta que expire el token, o -1 si ya expiró
 */
export function getTokenTimeToExpire(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return -1;
  }

  const now = Date.now() / 1000; // Convertir a segundos
  const timeLeft = decoded.exp - now;

  return Math.max(timeLeft, 0);
}

/**
 * Extrae el ID de usuario del token
 *
 * @param token - Token JWT
 * @returns ID del usuario o null
 */
export function getTokenUserId(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.sub || null;
}

/**
 * Extrae el email del token
 *
 * @param token - Token JWT
 * @returns Email del usuario o null
 */
export function getTokenEmail(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.email || null;
}

/**
 * Extrae el rol del token
 *
 * @param token - Token JWT
 * @returns Rol del usuario o null
 */
export function getTokenRole(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.role || null;
}

/**
 * Obtiene información de expiración del token
 *
 * @param token - Token JWT
 * @returns Objeto con información de expiración
 */
export function getTokenExpirationInfo(token: string) {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.exp) {
    return {
      isValid: false,
      isExpired: true,
      expiresAt: null,
      timeToExpire: null,
      message: 'Token inválido',
    };
  }

  const isExpired = isTokenExpired(token);
  const timeToExpire = getTokenTimeToExpire(token);
  const expiresAt = new Date(decoded.exp * 1000);

  return {
    isValid: !isExpired,
    isExpired,
    expiresAt,
    timeToExpire: isExpired ? 0 : Math.ceil(timeToExpire),
    message: isExpired ? 'Token expirado' : `Expira en ${Math.ceil(timeToExpire)}s`,
  };
}

/**
 * Extrae el raw token del header Authorization
 *
 * @param authHeader - Valor del header Authorization
 * @returns Token limpio o null
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;
  if (scheme !== 'Bearer' && scheme !== 'bearer') {
    return null;
  }

  return token.trim() || null;
}
