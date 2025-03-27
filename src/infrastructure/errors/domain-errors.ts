/**
 * Domain-specific error classes
 */

import { ApiError, ErrorDetails, ErrorResponse } from './api-error.ts';

/**
 * Error for invalid state transitions
 */
export class StateTransitionError extends ApiError {
  constructor(message: string = 'Invalid state transition', details: ErrorDetails | null = null) {
    super(message, 400, 'STATE_TRANSITION_ERROR', details);
  }
}

/**
 * Error for validation and invalid input
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR', details: ErrorDetails | null = null) {
    super(message, 400, code, details);
  }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND', details: ErrorDetails | null = null) {
    super(message, 404, code, details);
  }
}

/**
 * Error for authentication and authorization
 */
export class AuthError extends ApiError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTH_ERROR', details: ErrorDetails | null = null, status: number = 401) {
    super(message, status, code, details);
  }
}

/**
 * Error for server and internal issues
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error', code: string = 'INTERNAL_SERVER_ERROR', details: ErrorDetails | null = null, status: number = 500) {
    super(message, status, code, details);
  }
}

/**
 * Error for content negotiation
 */
export class ContentNegotiationError extends ApiError {
  constructor(message: string = 'Content negotiation failed', code: string = 'CONTENT_NEGOTIATION_FAILED', details: ErrorDetails | null = null) {
    super(message, 406, code, details);
  }
}

/**
 * Standard error responses for common scenarios
 */
export const Errors = {
  notFound: (message?: string, details?: ErrorDetails): ErrorResponse => 
    new NotFoundError(message || 'Resource not found', 'RESOURCE_NOT_FOUND', details || null).toJSON(),
  
  badRequest: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ValidationError(message || 'Bad request', 'BAD_REQUEST', details || null).toJSON(),
  
  unauthorized: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new AuthError(message || 'Unauthorized', 'UNAUTHORIZED', details || null, 401).toJSON(),
  
  forbidden: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new AuthError(message || 'Forbidden', 'FORBIDDEN', details || null, 403).toJSON(),
  
  conflict: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ServerError(message || 'Resource conflict', 'CONFLICT', details || null, 409).toJSON(),
  
  internalServerError: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ServerError(message || 'Internal server error', 'INTERNAL_SERVER_ERROR', details || null, 500).toJSON()
}; 