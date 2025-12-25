import { Request, Response, Router } from 'express';
import { authgearService } from '@services/auth/authgearService';
import { userService } from '@services/user/userService';
import { logger } from '@utils/logger';
import { AppError } from '@utils/errors';

/**
 * Tipos de eventos que emite Authgear
 */
export type AuthgearEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.disabled'
  | 'user.deleted';

/**
 * Estructura de un evento de Authgear
 */
export interface AuthgearWebhookEvent {
  type: AuthgearEventType;
  timestamp: number;
  data: {
    user_id: string;
    email: string;
    [key: string]: any;
  };
}

/**
 * Handler para webhook de Authgear
 * Recibe eventos cuando hay cambios en usuarios en Authgear
 *
 * POST /webhooks/authgear
 * Headers:
 *   - X-Authgear-Signature: HMAC-SHA256 signature
 */
async function handleAuthgearWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // 1. Validar que sea JSON
    if (!req.is('json')) {
      res.status(400).json({
        error: 'Content-Type debe ser application/json',
      });
      return;
    }

    // 2. Obtener y validar firma del webhook
    const signature = req.headers['x-authgear-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!signature) {
      logger.warn('Webhook sin firma rechazado');
      res.status(401).json({ error: 'Firma faltante' });
      return;
    }

    const isValid = authgearService.validateWebhookSignature(payload, signature);
    if (!isValid) {
      logger.warn('Webhook con firma inválida rechazado');
      res.status(401).json({ error: 'Firma inválida' });
      return;
    }

    // 3. Parsear evento
    const event: AuthgearWebhookEvent = req.body;

    logger.info(`Webhook Authgear recibido: ${event.type}`, {
      userId: event.data.user_id,
      email: event.data.email,
    });

    // 4. Procesar según tipo de evento
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event);
        break;

      case 'user.updated':
        await handleUserUpdated(event);
        break;

      case 'user.disabled':
        await handleUserDisabled(event);
        break;

      case 'user.deleted':
        await handleUserDeleted(event);
        break;

      default:
        logger.warn(`Evento desconocido: ${event.type}`);
    }

    // 5. Responder OK
    res.status(200).json({ success: true, event: event.type });
  } catch (error) {
    logger.error('Error procesando webhook Authgear', error);
    res.status(500).json({
      error: 'Error procesando webhook',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

/**
 * Maneja evento: user.created
 * Cuando un usuario se crea en Authgear, sincroniza con BD local
 */
async function handleUserCreated(event: AuthgearWebhookEvent): Promise<void> {
  try {
    const { user_id, email } = event.data;

    logger.info(`Usuario creado en Authgear: ${email}`);

    // Verificar si ya existe en BD
    const existing = await userService
      .getUserByAuthId(user_id)
      .catch(() => null);

    if (existing) {
      logger.info(`Usuario ya existía en BD: ${email}`);
      return;
    }

    // Crear usuario en BD
    const created = await userService.createUser(
      {
        email,
        firstName: event.data.given_name || 'Usuario',
        lastName: event.data.family_name || '',
        phone: event.data.phone || null,
        bio: null,
        profileImageUrl: event.data.picture || null,
        preferredLanguage: 'es',
      },
      user_id
    );

    logger.info(`Usuario creado en BD desde webhook: ${created.id}`);
  } catch (error) {
    logger.error('Error en handleUserCreated', error);
    throw error;
  }
}

/**
 * Maneja evento: user.updated
 * Cuando un usuario se actualiza en Authgear, actualiza BD local
 */
async function handleUserUpdated(event: AuthgearWebhookEvent): Promise<void> {
  try {
    const { user_id, email } = event.data;

    logger.info(`Usuario actualizado en Authgear: ${email}`);

    // Buscar usuario en BD
    const user = await userService.getUserByAuthId(user_id).catch(() => null);

    if (!user) {
      logger.warn(`Usuario no encontrado en BD: ${user_id}`);
      // Crear si no existe
      return handleUserCreated(event);
    }

    // Actualizar usuario
    const updateData = {
      email: event.data.email || user.email,
      firstName: event.data.given_name || user.firstName,
      lastName: event.data.family_name || user.lastName,
      phone: event.data.phone || user.phone,
      profileImageUrl: event.data.picture || user.profileImageUrl,
    };

    await userService.updateUser(user.id, updateData);

    logger.info(`Usuario actualizado en BD: ${user.id}`);
  } catch (error) {
    logger.error('Error en handleUserUpdated', error);
    throw error;
  }
}

/**
 * Maneja evento: user.disabled
 * Cuando un usuario se deshabilita en Authgear, deshabilita en BD
 */
async function handleUserDisabled(event: AuthgearWebhookEvent): Promise<void> {
  try {
    const { user_id, email } = event.data;

    logger.info(`Usuario deshabilitado en Authgear: ${email}`);

    // Buscar usuario en BD
    const user = await userService.getUserByAuthId(user_id).catch(() => null);

    if (!user) {
      logger.warn(`Usuario no encontrado en BD: ${user_id}`);
      return;
    }

    // Actualizar status a inactivo
    await userService.updateUser(user.id, { status: 'inactive' });

    logger.info(`Usuario deshabilitado en BD: ${user.id}`);
  } catch (error) {
    logger.error('Error en handleUserDisabled', error);
    throw error;
  }
}

/**
 * Maneja evento: user.deleted
 * Cuando un usuario se elimina en Authgear, elimina BD local (soft delete)
 */
async function handleUserDeleted(event: AuthgearWebhookEvent): Promise<void> {
  try {
    const { user_id, email } = event.data;

    logger.info(`Usuario eliminado en Authgear: ${email}`);

    // Buscar usuario en BD
    const user = await userService.getUserByAuthId(user_id).catch(() => null);

    if (!user) {
      logger.warn(`Usuario no encontrado en BD: ${user_id}`);
      return;
    }

    // Soft delete: marcar como inactivo
    await userService.updateUser(user.id, { status: 'deleted' });

    logger.info(`Usuario eliminado en BD (soft delete): ${user.id}`);
  } catch (error) {
    logger.error('Error en handleUserDeleted', error);
    throw error;
  }
}

/**
 * Ruta para webhooks de Authgear
 */
export function createAuthgearWebhookRouter(): Router {
  const router = Router();

  // POST /webhooks/authgear - Recibir eventos
  router.post('/', handleAuthgearWebhook);

  // GET /webhooks/authgear/health - Health check
  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'authgear-webhook',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

export { handleAuthgearWebhook };
