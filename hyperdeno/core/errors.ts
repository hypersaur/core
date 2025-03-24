/**
 * Standard error classes for the HATEOAS framework
 * 
 * Provides a consistent error handling system with standardized
 * error types and status codes for HTTP responses.
 */

export interface ErrorDetails {
  [key: string]: unknown;
}

export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    code: string;
    details?: ErrorDetails;
  };
}

/**
 * Base API error class for all framework errors
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details: ErrorDetails | null;

  /**
   * Create a new API error
   * @param message - Human-readable error message
   * @param status - HTTP status code
   * @param code - Machine-readable error code
   * @param details - Additional error details
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
   * Convert the error to a standardized response object
   * @returns Error response object
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
 * Error for resource not found
 */
export class NotFoundError extends ApiError {
  /**
   * Create a not found error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND', details: ErrorDetails | null = null) {
    super(message, 404, code, details);
  }
}

/**
 * Error for invalid input data
 */
export class ValidationError extends ApiError {
  /**
   * Create a validation error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR', details: ErrorDetails | null = null) {
    super(message, 400, code, details);
  }
}

/**
 * Error for invalid arguments in function calls
 */
export class InvalidArgumentError extends ApiError {
  /**
   * Create an invalid argument error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Invalid argument', code: string = 'INVALID_ARGUMENT', details: ErrorDetails | null = null) {
    super(message, 400, code, details);
  }
}

/**
 * Error for unauthorized requests
 */
export class UnauthorizedError extends ApiError {
  /**
   * Create an unauthorized error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', details: ErrorDetails | null = null) {
    super(message, 401, code, details);
  }
}

/**
 * Error for forbidden requests
 */
export class ForbiddenError extends ApiError {
  /**
   * Create a forbidden error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN', details: ErrorDetails | null = null) {
    super(message, 403, code, details);
  }
}

/**
 * Error for resource conflicts
 */
export class ConflictError extends ApiError {
  /**
   * Create a conflict error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT', details: ErrorDetails | null = null) {
    super(message, 409, code, details);
  }
}

/**
 * Error for invalid state transitions
 */
export class StateTransitionError extends ApiError {
  /**
   * Create a state transition error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Invalid state transition', code: string = 'INVALID_STATE_TRANSITION', details: ErrorDetails | null = null) {
    super(message, 422, code, details);
  }
}

/**
 * Error for content negotiation failures
 */
export class ContentNegotiationError extends ApiError {
  /**
   * Create a content negotiation error
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   */
  constructor(message: string = 'Content negotiation failed', code: string = 'CONTENT_NEGOTIATION_FAILED', details: ErrorDetails | null = null) {
    super(message, 406, code, details);
  }
}

/**
 * Standard error responses for common scenarios
 */
export const Errors = {
  /**
   * Create a not found error response
   * @param message - Error message
   * @param details - Additional error details
   * @returns Error response object
   */
  notFound: (message?: string, details?: ErrorDetails): ErrorResponse => 
    new NotFoundError(message, 'RESOURCE_NOT_FOUND', details || null).toJSON(),
  
  /**
   * Create a bad request error response
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional error details
   * @returns Error response object
   */
  badRequest: (message: string = 'Invalid request', code: string = 'BAD_REQUEST', details?: ErrorDetails): ErrorResponse => 
    new ApiError(message, 400, code, details || null).toJSON(),
  
  /**
   * Create an unauthorized error response
   * @param message - Error message
   * @param details - Additional error details
   * @returns Error response object
   */
  unauthorized: (message?: string, details?: ErrorDetails): ErrorResponse => 
    new UnauthorizedError(message, 'UNAUTHORIZED', details || null).toJSON(),
  
  /**
   * Create a forbidden error response
   * @param message - Error message
   * @param details - Additional error details
   * @returns Error response object
   */
  forbidden: (message: string = 'Access forbidden', details?: ErrorDetails): ErrorResponse => 
    new ForbiddenError(message, 'FORBIDDEN', details || null).toJSON(),
  
  /**
   * Create a validation error response
   * @param message - Error message
   * @param details - Additional error details
   * @returns Error response object
   */
  validation: (message: string = 'Validation failed', details?: ErrorDetails): ErrorResponse => 
    new ValidationError(message, 'VALIDATION_ERROR', details || null).toJSON(),
  
  /**
   * Create an internal server error response
   * @param message - Error message
   * @param details - Additional error details
   * @returns Error response object
   */
  internal: (message: string = 'Internal server error', details?: ErrorDetails): ErrorResponse => 
    new ApiError(message, 500, 'INTERNAL_ERROR', details || null).toJSON()
};

/**
 * Create an error response for an API request
 * @param error - Error instance
 * @returns HTTP response with error details
 */
export function createErrorResponse(error: Error): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify(error.toJSON()),
      {
        status: error.status,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Handle generic errors
  const apiError = new ApiError(
    error.message || 'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
  
  return new Response(
    JSON.stringify(apiError.toJSON()),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
} 