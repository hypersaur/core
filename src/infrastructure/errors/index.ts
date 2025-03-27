/**
 * Error Infrastructure Exports
 */

// Base API Error
export { ApiError, createErrorResponse, InvalidArgumentError } from './api-error.ts';
export type { ErrorDetails, ErrorResponse } from './api-error.ts';

// Domain Errors
export {
  StateTransitionError,
  ValidationError,
  NotFoundError,
  AuthError,
  ServerError,
  ContentNegotiationError,
  Errors
} from './domain-errors.ts'; 