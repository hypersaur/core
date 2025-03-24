/**
 * Standard error classes for the HATEOAS framework
 * 
 * Provides a consistent error handling system with standardized
 * error types and status codes for HTTP responses.
 */

/**
 * Base API error class for all framework errors
 */
class ApiError extends Error {
    /**
     * Create a new API error
     * @param {string} message - Human-readable error message
     * @param {number} [status=500] - HTTP status code
     * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
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
     * @returns {Object} Error response object
     */
    toJSON() {
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
  class NotFoundError extends ApiError {
    /**
     * Create a not found error
     * @param {string} [message='Resource not found'] - Error message
     * @param {string} [code='NOT_FOUND'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
      super(message, 404, code, details);
    }
  }
  
  /**
   * Error for invalid input data
   */
  class ValidationError extends ApiError {
    /**
     * Create a validation error
     * @param {string} [message='Validation failed'] - Error message
     * @param {string} [code='VALIDATION_ERROR'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', details = null) {
      super(message, 400, code, details);
    }
  }
  
  /**
   * Error for invalid arguments in function calls
   */
  class InvalidArgumentError extends ApiError {
    /**
     * Create an invalid argument error
     * @param {string} [message='Invalid argument'] - Error message
     * @param {string} [code='INVALID_ARGUMENT'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Invalid argument', code = 'INVALID_ARGUMENT', details = null) {
      super(message, 400, code, details);
    }
  }
  
  /**
   * Error for unauthorized requests
   */
  class UnauthorizedError extends ApiError {
    /**
     * Create an unauthorized error
     * @param {string} [message='Unauthorized'] - Error message
     * @param {string} [code='UNAUTHORIZED'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
      super(message, 401, code, details);
    }
  }
  
  /**
   * Error for forbidden requests
   */
  class ForbiddenError extends ApiError {
    /**
     * Create a forbidden error
     * @param {string} [message='Forbidden'] - Error message
     * @param {string} [code='FORBIDDEN'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
      super(message, 403, code, details);
    }
  }
  
  /**
   * Error for resource conflicts
   */
  class ConflictError extends ApiError {
    /**
     * Create a conflict error
     * @param {string} [message='Resource conflict'] - Error message
     * @param {string} [code='CONFLICT'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Resource conflict', code = 'CONFLICT', details = null) {
      super(message, 409, code, details);
    }
  }
  
  /**
   * Error for invalid state transitions
   */
  class StateTransitionError extends ApiError {
    /**
     * Create a state transition error
     * @param {string} [message='Invalid state transition'] - Error message
     * @param {string} [code='INVALID_STATE_TRANSITION'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Invalid state transition', code = 'INVALID_STATE_TRANSITION', details = null) {
      super(message, 422, code, details);
    }
  }
  
  /**
   * Error for content negotiation failures
   */
  class ContentNegotiationError extends ApiError {
    /**
     * Create a content negotiation error
     * @param {string} [message='Content negotiation failed'] - Error message
     * @param {string} [code='CONTENT_NEGOTIATION_FAILED'] - Error code
     * @param {Object} [details] - Additional error details
     */
    constructor(message = 'Content negotiation failed', code = 'CONTENT_NEGOTIATION_FAILED', details = null) {
      super(message, 406, code, details);
    }
  }
  
  /**
   * Standard error responses for common scenarios
   */
  const Errors = {
    /**
     * Create a not found error response
     * @param {string} [message] - Error message
     * @param {Object} [details] - Additional error details
     * @returns {Object} Error response object
     */
    notFound: (message, details) => new NotFoundError(message, 'RESOURCE_NOT_FOUND', details).toJSON(),
    
    /**
     * Create a bad request error response
     * @param {string} [message='Invalid request'] - Error message
     * @param {string} [code='BAD_REQUEST'] - Error code
     * @param {Object} [details] - Additional error details
     * @returns {Object} Error response object
     */
    badRequest: (message = 'Invalid request', code = 'BAD_REQUEST', details) => 
      new ApiError(message, 400, code, details).toJSON(),
    
    /**
     * Create an unauthorized error response
     * @param {string} [message] - Error message
     * @param {Object} [details] - Additional error details
     * @returns {Object} Error response object
     */
    unauthorized: (message, details) => new UnauthorizedError(message, 'UNAUTHORIZED', details).toJSON(),
    
    /**
     * Create a forbidden error response
     * @param {string} [message='Access forbidden'] - Error message
     * @param {Object} [details] - Additional error details
     * @returns {Object} Error response object
     */
    forbidden: (message = 'Access forbidden', details) => 
      new ForbiddenError(message, 'FORBIDDEN', details).toJSON(),
    
    /**
     * Create a validation error response
     * @param {string} [message='Validation failed'] - Error message
     * @param {Object} [details] - Additional error details
     * @returns {Object} Error response object
     */
    validation: (message = 'Validation failed', details) => 
      new ValidationError(message, 'VALIDATION_ERROR', details).toJSON(),
    
    /**
     * Create an internal server error response
     * @param {string} [message='Internal server error'] - Error message
     * @param {Object} [details] - Additional error details
     * @returns {Object} Error response object
     */
    internal: (message = 'Internal server error', details) => 
      new ApiError(message, 500, 'INTERNAL_ERROR', details).toJSON()
  };
  
  /**
   * Create an error response for an API request
   * @param {Error} error - Error instance
   * @returns {Response} HTTP response with error details
   */
  function createErrorResponse(error) {
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
  
  export {
    ApiError,
    NotFoundError,
    ValidationError,
    InvalidArgumentError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    StateTransitionError,
    ContentNegotiationError,
    Errors,
    createErrorResponse
  };