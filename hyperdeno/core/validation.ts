/**
 * 🔍 Centralized Validation Module
 * 
 * This module provides a unified validation system for the HATEOAS framework,
 * handling all validation logic in one place to ensure consistency and
 * reduce code duplication.
 */

import { ValidationError } from './errors.ts';

/**
 * 📝 Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 🎯 Base validator class
 */
export abstract class Validator<T> {
  abstract validate(value: T): ValidationResult;
}

/**
 * 📦 Request validator for HTTP requests
 */
export class RequestValidator extends Validator<Request> {
  validate(request: Request): ValidationResult {
    const errors: string[] = [];
    
    // Validate HTTP method
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(request.method)) {
      errors.push(`Invalid HTTP method: ${request.method}`);
    }
    
    // Validate headers
    const contentType = request.headers.get('content-type');
    if (request.method !== 'GET' && !contentType?.includes('application/json')) {
      errors.push('Content-Type must be application/json for non-GET requests');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 🔄 Resource validator for HATEOAS resources
 */
export class ResourceValidator extends Validator<unknown> {
  validate(resource: unknown): ValidationResult {
    const errors: string[] = [];
    
    if (!resource || typeof resource !== 'object') {
      errors.push('Resource must be a non-null object');
      return { isValid: false, errors };
    }
    
    const r = resource as Record<string, unknown>;
    
    // Validate required fields
    if (!r._links) {
      errors.push('Resource must have _links property');
    }
    
    if (!r._embedded && !r._links?.self) {
      errors.push('Resource must have either _embedded or self link');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 🎨 Validation utility functions
 */
export const validate = {
  /**
   * Validates a request and throws ValidationError if invalid
   */
  request: (request: Request): void => {
    const validator = new RequestValidator();
    const result = validator.validate(request);
    
    if (!result.isValid) {
      throw new ValidationError('Invalid request', 'REQUEST_VALIDATION_ERROR', {
        errors: result.errors
      });
    }
  },
  
  /**
   * Validates a resource and throws ValidationError if invalid
   */
  resource: (resource: unknown): void => {
    const validator = new ResourceValidator();
    const result = validator.validate(resource);
    
    if (!result.isValid) {
      throw new ValidationError('Invalid resource', 'RESOURCE_VALIDATION_ERROR', {
        errors: result.errors
      });
    }
  }
}; 