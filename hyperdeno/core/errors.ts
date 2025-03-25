/**
 * ⚠️ Standard Error Classes for HATEOAS Framework
 * 
 * This module provides a comprehensive error handling system for HATEOAS APIs,
 * ensuring consistent error responses that follow REST and HATEOAS principles.
 * Each error type includes appropriate HTTP status codes and machine-readable
 * error codes for client processing.
 * 
 * Key features:
 * - Standardized error response format
 * - HTTP status code mapping
 * - Machine-readable error codes
 * - Detailed error information
 * 
 * @example
 * ```typescript
 * throw new NotFoundError('User not found', 'USER_NOT_FOUND', {
 *   resource: 'user',
 *   id: '123'
 * });
 * ```
 */

/**
 * 📝 Interface for additional error details
 * 
 * Allows for flexible error details that can include any relevant
 * information about the error condition.
 * 
 * @interface ErrorDetails
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * 📦 Interface for standardized error responses
 * 
 * Defines the structure of error responses in HATEOAS APIs, ensuring
 * consistent error handling across the application.
 * 
 * @interface ErrorResponse
 * @property {Object} error - The error object
 * @property {string} error.message - Human-readable error message
 * @property {number} error.status - HTTP status code
 * @property {string} error.code - Machine-readable error code
 * @property {ErrorDetails} [error.details] - Additional error details
 */
export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    code: string;
    details?: ErrorDetails;
  };
}

/**
 * 🎯 Base API error class for all framework errors
 * 
 * Provides the foundation for all HATEOAS-specific errors, including
 * standardized error handling and response formatting.
 * 
 * @class ApiError
 * @extends {Error}
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details: ErrorDetails | null;

  /**
   * 🎨 Creates a new API error
   * 
   * Initializes a new API error with standardized fields for consistent
   * error handling across the HATEOAS framework.
   * 
   * @param {string} message - Human-readable error message
   * @param {number} [status=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details: ErrorDetails | null = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace in modern JS engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * 📦 Converts the error to a standardized response object
   * 
   * Formats the error into a consistent JSON structure that follows
   * HATEOAS principles and provides all necessary information for
   * client processing.
   * 
   * @returns {ErrorResponse} The formatted error response
   */
  toJSON(): ErrorResponse {
    return {
      error: {
        message: this.message,
        status: this.status,
        code: this.code,
        ...(this.details ? { details: this.details } : {})
      }
    };
  }
}

/**
 * 🔍 Error for resource not found
 * 
 * Represents a 404 Not Found error, which is common in HATEOAS APIs
 * when a requested resource cannot be found.
 * 
 * @class NotFoundError
 * @extends {ApiError}
 */
export class NotFoundError extends ApiError {
  /**
   * 🎨 Creates a not found error
   * 
   * @param {string} [message='Resource not found'] - Error message
   * @param {string} [code='NOT_FOUND'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND', details: ErrorDetails | null = null) {
    super(message, 404, code, details);
  }
}

/**
 * ⚠️ Error for invalid input data
 * 
 * Represents a 400 Bad Request error, used when client input fails
 * validation or is otherwise invalid.
 * 
 * @class ValidationError
 * @extends {ApiError}
 */
export class ValidationError extends ApiError {
  /**
   * 🎨 Creates a validation error
   * 
   * @param {string} [message='Validation failed'] - Error message
   * @param {string} [code='VALIDATION_ERROR'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR', details: ErrorDetails | null = null) {
    super(message, 400, code, details);
  }
}

/**
 * ⚠️ Error for invalid arguments in function calls
 * 
 * Represents a 400 Bad Request error, used when function arguments
 * are invalid or missing.
 * 
 * @class InvalidArgumentError
 * @extends {ApiError}
 */
export class InvalidArgumentError extends ApiError {
  /**
   * 🎨 Creates an invalid argument error
   * 
   * @param {string} [message='Invalid argument'] - Error message
   * @param {string} [code='INVALID_ARGUMENT'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Invalid argument', code: string = 'INVALID_ARGUMENT', details: ErrorDetails | null = null) {
    super(message, 400, code, details);
  }
}

/**
 * 🔒 Error for unauthorized requests
 * 
 * Represents a 401 Unauthorized error, used when authentication
 * is required but not provided.
 * 
 * @class UnauthorizedError
 * @extends {ApiError}
 */
export class UnauthorizedError extends ApiError {
  /**
   * 🎨 Creates an unauthorized error
   * 
   * @param {string} [message='Unauthorized'] - Error message
   * @param {string} [code='UNAUTHORIZED'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', details: ErrorDetails | null = null) {
    super(message, 401, code, details);
  }
}

/**
 * 🔒 Error for forbidden requests
 * 
 * Represents a 403 Forbidden error, used when authentication is
 * provided but the user lacks permission.
 * 
 * @class ForbiddenError
 * @extends {ApiError}
 */
export class ForbiddenError extends ApiError {
  /**
   * 🎨 Creates a forbidden error
   * 
   * @param {string} [message='Forbidden'] - Error message
   * @param {string} [code='FORBIDDEN'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN', details: ErrorDetails | null = null) {
    super(message, 403, code, details);
  }
}

/**
 * ⚠️ Error for resource conflicts
 * 
 * Represents a 409 Conflict error, used when a request conflicts
 * with the current state of the resource.
 * 
 * @class ConflictError
 * @extends {ApiError}
 */
export class ConflictError extends ApiError {
  /**
   * 🎨 Creates a conflict error
   * 
   * @param {string} [message='Resource conflict'] - Error message
   * @param {string} [code='CONFLICT'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT', details: ErrorDetails | null = null) {
    super(message, 409, code, details);
  }
}

/**
 * 🔄 Error for invalid state transitions
 * 
 * Represents a 422 Unprocessable Entity error, used when a state
 * transition is requested but not allowed in the current state.
 * 
 * @class StateTransitionError
 * @extends {ApiError}
 */
export class StateTransitionError extends ApiError {
  /**
   * 🎨 Creates a state transition error
   * 
   * @param {string} [message='Invalid state transition'] - Error message
   * @param {string} [code='INVALID_STATE_TRANSITION'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Invalid state transition', code: string = 'INVALID_STATE_TRANSITION', details: ErrorDetails | null = null) {
    super(message, 422, code, details);
  }
}

/**
 * 🔄 Error for content negotiation failures
 * 
 * Represents a 406 Not Acceptable error, used when the server
 * cannot produce a response matching the client's content
 * negotiation preferences.
 * 
 * @class ContentNegotiationError
 * @extends {ApiError}
 */
export class ContentNegotiationError extends ApiError {
  /**
   * 🎨 Creates a content negotiation error
   * 
   * @param {string} [message='Content negotiation failed'] - Error message
   * @param {string} [code='CONTENT_NEGOTIATION_FAILED'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Content negotiation failed', code: string = 'CONTENT_NEGOTIATION_FAILED', details: ErrorDetails | null = null) {
    super(message, 406, code, details);
  }
}

/**
 * 📚 Standard error responses for common scenarios
 * 
 * Provides factory functions for creating standardized error responses
 * that follow HATEOAS principles and include appropriate status codes
 * and error details.
 */
export const Errors = {
  /**
   * 🔍 Creates a not found error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  notFound: (message?: string, details?: ErrorDetails): ErrorResponse => 
    new NotFoundError(message, 'RESOURCE_NOT_FOUND', details || null).toJSON(),
  
  /**
   * ⚠️ Creates a bad request error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  badRequest: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ValidationError(message, 'BAD_REQUEST', details || null).toJSON(),
  
  /**
   * 🔒 Creates an unauthorized error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  unauthorized: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new UnauthorizedError(message, 'UNAUTHORIZED', details || null).toJSON(),
  
  /**
   * 🔒 Creates a forbidden error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  forbidden: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ForbiddenError(message, 'FORBIDDEN', details || null).toJSON(),
  
  /**
   * ⚠️ Creates a conflict error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  conflict: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ConflictError(message, 'CONFLICT', details || null).toJSON(),
  
  /**
   * 🔄 Creates a state transition error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  invalidStateTransition: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new StateTransitionError(message, 'INVALID_STATE_TRANSITION', details || null).toJSON(),
  
  /**
   * 🔄 Creates a content negotiation error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  contentNegotiationFailed: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ContentNegotiationError(message, 'CONTENT_NEGOTIATION_FAILED', details || null).toJSON(),
  
  /**
   * ⚠️ Creates an internal server error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  internalServerError: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ApiError(message || 'Internal server error', 500, 'INTERNAL_SERVER_ERROR', details || null).toJSON()
};

/**
 * 🎯 Creates a Response object from an Error
 * 
 * Converts an Error instance into a proper Response object with
 * appropriate status code and headers for HATEOAS APIs.
 * 
 * @param {Error} error - The error to convert
 * @returns {Response} A Response object containing the error
 */
export function createErrorResponse(error: Error): Response {
  const status = error instanceof ApiError ? error.status : 500;
  const body = error instanceof ApiError ? error.toJSON() : Errors.internalServerError(error.message);
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 