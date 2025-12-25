import axios, { AxiosError } from 'axios';
import jwt from 'jsonwebtoken';
import JwksClient from 'jwks-rsa';
import config from '@config/environment';
import { logger } from '@utils/logger';
import { AuthenticationError } from '@utils/errors';
import { AuthUser, UserRole, UserStatus, createUUID } from '@CustomTypes/common.types';
import { userService } from '@services/user/userService';

/**
 * Payload del token JWT de Authgear
 */
interface AuthgearTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

/**
 * Información del usuario desde Authgear
 */
interface AuthgearUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
  custom_attributes?: {
    role?: string;
    phone?: string;
    bio?: string;
  };
}

/**
 * Servicio para integración con Authgear
 * Maneja validación de tokens, sincronización de usuarios y webhooks
 */
export class AuthgearService {
  private jwksClient: JwksClient.JwksClient;
  private tokenCache: Map<string, { payload: AuthgearTokenPayload; timestamp: number }> = new Map();
  private cacheTTL: number;

  constructor() {
    this.cacheTTL = config.authgear.tokenCacheTTL || 3600000; // 1 hora por defecto

    this.jwksClient = new JwksClient({
      jwksUri: config.authgear.jwksUri,
      cache: true,
      cacheMaxEntries: 10,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutos
    });

    logger.info('✓ AuthgearService inicializado', {
      endpoint: config.authgear.endpoint,
      jwksUri: config.authgear.jwksUri,
    });
  }

  /**
   * Verifica un token JWT contra Authgear
   * 1. Decodifica el token
   * 2. Valida con JWKS de Authgear
   * 3. Obtiene información completa del usuario
   * 4. Sincroniza con BD local
   */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      // 1. Comprobar cache
      const cached = this.getFromCache(token);
      if (cached) {
        logger.debug('Token encontrado en cache');
        return cached;
      }

      // 2. Decodificar sin verificar para obtener header
      const decoded = jwt.decode(token, { complete: true }) as any;

      if (!decoded || !decoded.header || !decoded.payload) {
        throw new AuthenticationError('Token inválido: estructura incorrecta');
      }

      // 3. Verificar JWT con clave pública de Authgear
      await this.verifyJWT(token, decoded);

      // 4. Obtener info completa del usuario
      const userInfo = await this.getUserInfo(token);

      // 5. Sincronizar/crear usuario en BD local
      const user = await this.syncUser(userInfo);

      // 6. Guardar en cache
      this.setInCache(token, user);

      return user;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Error verificando token', error);
      throw new AuthenticationError('Token inválido o expirado');
    }
  }

  /**
   * Verifica JWT usando JWKS de Authgear
   * Valida que el token esté firmado correctamente y no haya expirado
   */
  private async verifyJWT(token: string, decoded: any): Promise<AuthgearTokenPayload> {
    try {
      // Obtener clave pública desde JWKS
      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const publicKey = key.getPublicKey();

      // Verificar firma y validez
      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: config.authgear.clientId,
      }) as AuthgearTokenPayload;

      return verified;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Token inválido: firma incorrecta');
      }
      throw error;
    }
  }

  /**
   * Obtiene información completa del usuario desde Authgear
   * Endpoint: GET /oauth/userinfo
   */
  private async getUserInfo(token: string): Promise<AuthgearUserInfo> {
    try {
      const response = await axios.get(`${config.authgear.endpoint}/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      const userInfo = response.data as AuthgearUserInfo;

      // Validar campos requeridos
      if (!userInfo.sub || !userInfo.email) {
        throw new AuthenticationError('Información incompleta del usuario');
      }

      return userInfo;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new AuthenticationError('Token rechazado por Authgear');
      }
      logger.error('Error obteniendo userinfo de Authgear', {
        status: axiosError.response?.status,
        message: axiosError.message,
      });
      throw new AuthenticationError('No se pudo obtener información del usuario');
    }
  }

  /**
   * Sincroniza usuario de Authgear con BD local
   * - Si no existe: crea nuevo usuario
   * - Si existe: actualiza información
   */
  private async syncUser(userInfo: AuthgearUserInfo): Promise<AuthUser> {
    try {
      const authId = userInfo.sub;

      // Buscar usuario existente por authId
      let user = await userService.getUserByAuthId(authId).catch(() => null);

      if (!user) {
        // Crear usuario si no existe
        logger.info(`Creando nuevo usuario desde Authgear: ${userInfo.email}`);

        const created = await userService.createUser(
          {
            email: userInfo.email,
            firstName: userInfo.given_name || userInfo.name || 'Usuario',
            lastName: userInfo.family_name || '',
            phone: userInfo.custom_attributes?.phone || null,
            bio: userInfo.custom_attributes?.bio || null,
            profileImageUrl: userInfo.picture || null,
            preferredLanguage: 'es',
          },
          authId
        );

        return {
          id: created.id,
          email: created.email,
          role: (userInfo.custom_attributes?.role as UserRole) || UserRole.STUDENT,
        };
      }

      // Usuario existe - actualizar si cambió info importante
      if (
        user.firstName !== (userInfo.given_name || userInfo.name) ||
        user.lastName !== (userInfo.family_name || '') ||
        user.profileImageUrl !== userInfo.picture
      ) {
        logger.info(`Actualizando usuario sincronizado: ${userInfo.email}`);

        await userService.updateUser(user.id, {
          firstName: userInfo.given_name || userInfo.name || user.firstName,
          lastName: userInfo.family_name || user.lastName,
          profileImageUrl: userInfo.picture || user.profileImageUrl,
          phone: userInfo.custom_attributes?.phone || user.phone,
          bio: userInfo.custom_attributes?.bio || user.bio,
        });
      }

      return {
        id: user.id,
        email: user.email,
        role: (userInfo.custom_attributes?.role as UserRole) || user.role,
      };
    } catch (error) {
      logger.error('Error sincronizando usuario', error);
      throw error;
    }
  }

  /**
   * Valida la firma de un webhook de Authgear
   * Usa HMAC SHA256 con el webhook secret
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const hmac = crypto
        .createHmac('sha256', config.authgear.webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = hmac === signature;

      if (!isValid) {
        logger.warn('Webhook con firma inválida rechazado');
      }

      return isValid;
    } catch (error) {
      logger.error('Error validando firma de webhook', error);
      return false;
    }
  }

  /**
   * Invalida el cache de un token (después de logout)
   */
  invalidateTokenCache(token: string): void {
    this.tokenCache.delete(token);
    logger.debug('Token removido del cache');
  }

  /**
   * Limpia tokens expirados del cache cada hora
   */
  startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [token, data] of this.tokenCache.entries()) {
        if (now - data.timestamp > this.cacheTTL) {
          this.tokenCache.delete(token);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cache cleanup: ${cleaned} tokens removidos`);
      }
    }, 60 * 60 * 1000); // Cada hora
  }

  // ============ PRIVATE HELPERS ============

  private getFromCache(token: string): AuthUser | null {
    const cached = this.tokenCache.get(token);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.tokenCache.delete(token);
      return null;
    }

    return {
      id: createUUID(cached.payload.sub),
      email: cached.payload.email,
      role: UserRole.STUDENT, // Se obtiene del userInfo, no del token
    };
  }

  private setInCache(
    token: string,
    user: AuthUser
  ): void {
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (decoded && decoded.payload) {
      this.tokenCache.set(token, {
        payload: decoded.payload,
        timestamp: Date.now(),
      });
    }
  }
}

// Singleton
export const authgearService = new AuthgearService();

// Iniciar limpieza de cache
authgearService.startCacheCleanup();
