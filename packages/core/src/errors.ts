export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    options?: { code?: string; statusCode?: number; details?: unknown },
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code ?? 'INTERNAL_ERROR';
    this.statusCode = options?.statusCode ?? 500;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: 400, details });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { code: 'AUTHENTICATION_REQUIRED', statusCode: 401 });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, { code: 'INSUFFICIENT_PERMISSIONS', statusCode: 403 });
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} '${id}' not found` : `${resource} not found`;
    super(msg, { code: 'NOT_FOUND', statusCode: 404 });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'CONFLICT', statusCode: 409, details });
    this.name = 'ConflictError';
  }
}

export class ConnectorError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'CONNECTOR_ERROR', statusCode: 500, details });
    this.name = 'ConnectorError';
  }
}

export class DestinationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: 'DESTINATION_ERROR', statusCode: 500, details });
    this.name = 'DestinationError';
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
