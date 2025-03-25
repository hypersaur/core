/**
 * ⚠️ Standard Error Classes for HATEOAS Framework
 * 
 * This module provides a streamlined error handling system for HATEOAS APIs,
 * ensuring consistent error responses that follow REST and HATEOAS principles.
 * Core error types cover the most common use cases while maintaining flexibility
 * through error details.
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
 * ⚠️ Error for validation and invalid input
 * 
 * Handles all validation-related errors including:
 * - Invalid input data
 * - Invalid arguments
 * - Content negotiation failures
 * - State transition errors
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
 * 🔒 Error for authentication and authorization
 * 
 * Handles all security-related errors including:
 * - Unauthorized access
 * - Forbidden operations
 * - Authentication failures
 * 
 * @class AuthError
 * @extends {ApiError}
 */
export class AuthError extends ApiError {
  /**
   * 🎨 Creates an authentication error
   * 
   * @param {string} [message='Authentication failed'] - Error message
   * @param {string} [code='AUTH_ERROR'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Authentication failed', code: string = 'AUTH_ERROR', details: ErrorDetails | null = null) {
    super(message, 401, code, details);
  }
}

/**
 * ⚠️ Error for server and internal issues
 * 
 * Handles all server-side errors including:
 * - Internal server errors
 * - Resource conflicts
 * - Service unavailability
 * 
 * @class ServerError
 * @extends {ApiError}
 */
export class ServerError extends ApiError {
  /**
   * 🎨 Creates an internal server error
   * 
   * @param {string} [message='Internal server error'] - Error message
   * @param {string} [code='SERVER_ERROR'] - Error code
   * @param {ErrorDetails | null} [details=null] - Additional error details
   */
  constructor(message: string = 'Internal server error', code: string = 'SERVER_ERROR', details: ErrorDetails | null = null) {
    super(message, 500, code, details);
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
    new AuthError(message, 'UNAUTHORIZED', details || null).toJSON(),
  
  /**
   * 🔒 Creates a forbidden error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  forbidden: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new AuthError(message, 'FORBIDDEN', details || null).toJSON(),
  
  /**
   * ⚠️ Creates a conflict error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  conflict: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ServerError(message, 'CONFLICT', details || null).toJSON(),
  
  /**
   * 🔄 Creates a state transition error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  invalidStateTransition: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ValidationError(message, 'INVALID_STATE_TRANSITION', details || null).toJSON(),
  
  /**
   * 🔄 Creates a content negotiation error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  contentNegotiationFailed: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ValidationError(message, 'CONTENT_NEGOTIATION_FAILED', details || null).toJSON(),
  
  /**
   * ⚠️ Creates an internal server error response
   * 
   * @param {string} [message] - Error message
   * @param {ErrorDetails} [details] - Additional error details
   * @returns {ErrorResponse} The formatted error response
   */
  internalServerError: (message?: string, details?: ErrorDetails): ErrorResponse =>
    new ServerError(message || 'Internal server error', 'INTERNAL_SERVER_ERROR', details || null).toJSON()
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