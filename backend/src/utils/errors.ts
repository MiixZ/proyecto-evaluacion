export class AppError extends Error {
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

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', 400, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autenticado') {
    super('UNAUTHORIZED', 401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'No autorizado') {
    super('FORBIDDEN', 403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} no encontrado`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', 409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

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
