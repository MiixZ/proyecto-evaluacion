import jwt from 'jsonwebtoken';
import { logger } from '@utils/logger';

/**
 * Interfaz para token decodificado
 */
export interface DecodedToken {
  header: {
    alg: string;
    kid: string;
    typ: string;
  };
  payload: {
    sub: string;
    email: string;
    email_verified: boolean;
    iat: number;
    exp: number;
    aud: string;
    iss: string;
    [key: string]: any;
  };
  signature: string;
}

/**
 * Decodifica un token JWT sin verificar la firma
 * Útel: Sólo para extraer información, no para validación
 *
 * @param token - Token JWT
 * @returns Token decodificado o null si es inválido
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;

    if (!decoded) {
      return null;
    }

    return {
      header: decoded.header,
      payload: decoded.payload,
      signature: decoded.signature,
    };
  } catch (error) {
    logger.warn('Error decodificando token', { error: error instanceof Error ? error.message : error });
    return null;
  }
}

/**
 * Comprueba si un token ha expirado
 *
 * @param token - Token JWT
 * @returns true si está expirado, false si sigue siendo válido
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.payload.exp) {
    return true;
  }

  const now = Date.now() / 1000; // Convertir a segundos
  return decoded.payload.exp < now;
}

/**
 * Obtiene el tiempo de expiración de un token en ms
 *
 * @param token - Token JWT
 * @returns Milisegundos hasta que expire el token, o -1 si ya expiró
 */
export function getTokenTimeToExpire(token: string): number {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.payload.exp) {
    return -1;
  }

  const now = Date.now() / 1000; // Convertir a segundos
  const timeLeft = (decoded.payload.exp - now) * 1000; // Convertir a ms

  return Math.max(timeLeft, 0);
}

/**
 * Extrae el ID de usuario (sub) del token
 *
 * @param token - Token JWT
 * @returns ID del usuario o null
 */
export function getTokenSubject(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.payload.sub || null;
}

/**
 * Extrae el email del token
 *
 * @param token - Token JWT
 * @returns Email del usuario o null
 */
export function getTokenEmail(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.payload.email || null;
}

/**
 * Obtiene el Key ID (kid) del header del token
 * Usado para identificar cuál clave JWKS usar para validar
 *
 * @param token - Token JWT
 * @returns Key ID o null
 */
export function getTokenKeyId(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.header.kid || null;
}

/**
 * Comprueba si el token tiene estructura válida
 *
 * @param token - Token JWT
 * @returns true si tiene estructura válida
 */
export function isTokenStructureValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const decoded = decodeToken(token);

    return (
      decoded !== null &&
      decoded.header &&
      decoded.payload &&
      decoded.header.kid &&
      decoded.payload.sub &&
      decoded.payload.email
    );
  } catch {
    return false;
  }
}

/**
 * Valida que el token tenga campos requeridos de Authgear
 *
 * @param token - Token JWT
 * @returns Array de errores (vacío si todo está bien)
 */
export function validateTokenFields(token: string): string[] {
  const errors: string[] = [];
  const decoded = decodeToken(token);

  if (!decoded) {
    errors.push('Token inválido o corrupto');
    return errors;
  }

  // Campos requeridos
  const requiredFields = ['sub', 'email', 'iat', 'exp'];

  for (const field of requiredFields) {
    if (!decoded.payload[field]) {
      errors.push(`Campo requerido ausente: ${field}`);
    }
  }

  // Validaciones de tipo
  if (typeof decoded.payload.exp !== 'number') {
    errors.push('Campo exp debe ser un número (timestamp)');
  }

  if (typeof decoded.payload.iat !== 'number') {
    errors.push('Campo iat debe ser un número (timestamp)');
  }

  // Validar que iat < exp
  if (decoded.payload.iat && decoded.payload.exp) {
    if (decoded.payload.iat > decoded.payload.exp) {
      errors.push('Campo iat es mayor que exp (token inválido)');
    }
  }

  return errors;
}

/**
 * Formatea información de expiración de token para logging
 *
 * @param token - Token JWT
 * @returns Objeto con información de expiración
 */
export function getTokenExpirationInfo(token: string) {
  const decoded = decodeToken(token);

  if (!decoded) {
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
  const expiresAt = new Date(decoded.payload.exp * 1000);

  return {
    isValid: !isExpired,
    isExpired,
    expiresAt,
    timeToExpire: isExpired ? 0 : Math.ceil(timeToExpire / 1000), // En segundos
    message: isExpired ? 'Token expirado' : `Expira en ${Math.ceil(timeToExpire / 1000)}s`,
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

/**
 * Log estructurado de información del token (sin datos sensibles)
 *
 * @param token - Token JWT
 * @param context - Contexto adicional para logging
 */
export function logTokenInfo(token: string, context: string = ''): void {
  const decoded = decodeToken(token);

  if (!decoded) {
    logger.warn(`Token inválido en ${context}`);
    return;
  }

  const expInfo = getTokenExpirationInfo(token);

  logger.debug(`Token info (${context})`, {
    subject: decoded.payload.sub,
    email: decoded.payload.email,
    audience: decoded.payload.aud,
    issuer: decoded.payload.iss,
    expiresAt: expInfo.expiresAt,
    timeToExpire: expInfo.timeToExpire,
    isExpired: expInfo.isExpired,
  });
}
