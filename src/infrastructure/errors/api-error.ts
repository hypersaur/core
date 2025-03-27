/**
 * Base API error classes and interfaces
 */

/**
 * Error details interface
 */
export interface ErrorDetails {
  fields?: Record<string, string>;
  supported?: string[];
  id?: string;
  [key: string]: unknown;
}

/**
 * Standardized error response interface
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
 * Base API error class
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details: ErrorDetails | null;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', details: ErrorDetails | null = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
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
 * Create a Response from an Error
 */
export function createErrorResponse(error: Error): Response {
  const status = error instanceof ApiError ? error.status : 500;
  const body = error instanceof ApiError 
    ? error.toJSON() 
    : new ApiError(error.message, 500, 'INTERNAL_ERROR').toJSON();
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Invalid argument error
 */
export class InvalidArgumentError extends ApiError {
  constructor(message: string = 'Invalid argument', details: ErrorDetails | null = null) {
    super(message, 400, 'INVALID_ARGUMENT', details);
  }
} 