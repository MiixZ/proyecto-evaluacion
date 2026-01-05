/**
 * Clase base para errores personalizados de la aplicación
 */
export class AppError extends Error {
  /**
   * @param code - Código identificador del error
   * @param statusCode - Código de estado HTTP
   * @param message - Mensaje descriptivo del error
   * @param details - Detalles adicionales opcionales
   */
  constructor(
    public code: string,
    public statusCode: number,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error de validación de datos (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', 400, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error de autenticación - usuario no identificado (401 Unauthorized)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autenticado') {
    super('UNAUTHORIZED', 401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error de autorización - usuario sin permisos suficientes (403 Forbidden)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'No autorizado') {
    super('FORBIDDEN', 403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error de recurso no encontrado (404 Not Found)
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} no encontrado`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de conflicto con el estado actual (409 Conflict)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', 409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error interno del servidor (500 Internal Server Error)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor') {
    super('INTERNAL_SERVER_ERROR', 500, message);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Alias para compatibilidad
 */
export class AuthenticationError extends UnauthorizedError {}
export class AuthorizationError extends ForbiddenError {}
