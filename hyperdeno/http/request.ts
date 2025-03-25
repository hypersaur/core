/**
 * 🔄 Request Utilities for HATEOAS API
 * 
 * This module provides helper functions for working with web standard Request
 * objects in a HATEOAS context. It handles request parsing, validation, and
 * data extraction while maintaining HATEOAS principles.
 * 
 * Key features:
 * - Path parameter parsing
 * - Query parameter handling
 * - Request body parsing
 * - Data validation
 * 
 * @example
 * ```typescript
 * const params = parsePath('/users/:id', request.url);
 * const query = parseQuery(request);
 * const body = await parseBody(request);
 * ```
 */

import { ValidationError } from '../core/errors.ts';

/**
 * 🛣️ Path parameters interface
 * 
 * Defines the structure for URL path parameters extracted from
 * request paths, enabling dynamic route handling.
 * 
 * @interface PathParams
 * @property {string} [key: string] - Path parameter values
 */
export interface PathParams {
  [key: string]: string;
}

/**
 * 🔍 Query parameters interface
 * 
 * Defines the structure for URL query parameters extracted from
 * request URLs, enabling flexible request filtering and options.
 * 
 * @interface QueryParams
 * @property {string} [key: string] - Query parameter values
 */
export interface QueryParams {
  [key: string]: string;
}

/**
 * 📝 Form data interface
 * 
 * Defines the structure for form data submitted in requests,
 * supporting both text fields and file uploads.
 * 
 * @interface FormData
 * @property {string | File} [key: string] - Form field values
 */
export interface FormData {
  [key: string]: string | File;
}

/**
 * ✅ Validation rule interface
 * 
 * Defines the structure for validation rules that can be applied
 * to request data, ensuring data integrity and type safety.
 * 
 * @interface ValidationRule
 * @property {boolean} [required] - Whether the field is required
 * @property {'string' | 'number' | 'boolean' | 'array' | 'object'} [type] - Data type
 * @property {number} [min] - Minimum value for numbers
 * @property {number} [max] - Maximum value for numbers
 * @property {number} [minLength] - Minimum length for strings
 * @property {number} [maxLength] - Maximum length for strings
 * @property {string} [pattern] - Regular expression pattern
 * @property {Function} [validate] - Custom validation function
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validate?: (value: unknown) => boolean | string;
}

/**
 * 📚 Validation schema interface
 * 
 * Defines a schema for validating request data, mapping field
 * names to their validation rules.
 * 
 * @interface ValidationSchema
 * @property {ValidationRule} [key: string] - Field validation rules
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * 🛣️ Parse URL path parameters
 * 
 * Extracts path parameters from a URL path based on a pattern,
 * enabling dynamic route handling and parameter extraction.
 * 
 * @param {string} pattern - URL pattern with parameter placeholders
 * @param {string} path - Actual URL path
 * @returns {PathParams} Path parameters
 */
export function parsePath(pattern: string, path: string): PathParams {
  const params: PathParams = {};
  
  // Convert pattern to regex
  const patternParts = pattern.split('/')
    .filter(part => part !== '');
  
  const pathParts = path.split('/')
    .filter(part => part !== '');
  
  // Check if the number of parts matches
  if (patternParts.length !== pathParts.length) {
    return params;
  }
  
  // Extract parameters
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    
    // Check if this part is a parameter
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathParts[i];
    } else if (patternPart !== pathParts[i]) {
      // If not a parameter, the parts must match exactly
      return {};
    }
  }
  
  return params;
}

/**
 * 🔍 Parse query parameters from a request URL
 * 
 * Extracts query parameters from a request URL, enabling
 * flexible request filtering and options.
 * 
 * @param {Request} request - Web standard Request object
 * @returns {QueryParams} Query parameters
 */
export function parseQuery(request: Request): QueryParams {
  const url = new URL(request.url);
  const query: QueryParams = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }
  
  return query;
}

/**
 * 📦 Parse JSON request body
 * 
 * Parses a JSON request body, handling potential parsing errors
 * and providing meaningful error messages.
 * 
 * @param {Request} request - Web standard Request object
 * @returns {Promise<unknown>} Parsed JSON body
 * @throws {ValidationError} If JSON is invalid
 */
export async function parseJSON(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (err) {
    throw new ValidationError('Invalid JSON in request body', 'INVALID_JSON', {
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * 📝 Parse form data from request body
 * 
 * Parses form data from a request body, supporting both text
 * fields and file uploads.
 * 
 * @param {Request} request - Web standard Request object
 * @returns {Promise<FormData>} Parsed form data
 */
export async function parseFormData(request: Request): Promise<FormData> {
  const formData = await request.formData();
  const data: FormData = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
}

/**
 * 🔄 Parse request body based on content type
 * 
 * Parses a request body based on its content type, supporting
 * various formats including JSON and form data.
 * 
 * @param {Request} request - Web standard Request object
 * @returns {Promise<unknown | null>} Parsed body
 * @throws {ValidationError} If content type is unsupported
 */
export async function parseBody(request: Request): Promise<unknown | null> {
  // Check if the request has a body
  if (['GET', 'HEAD'].includes(request.method)) {
    return null;
  }
  
  const contentType = request.headers.get('Content-Type');

  // Handle different content types
  if (!contentType || contentType.includes('application/json')) {
    return await parseJSON(request);
  }
  
  if (contentType.includes('application/x-www-form-urlencoded') || 
      contentType.includes('multipart/form-data')) {
    return await parseFormData(request);
  }
  
  throw new ValidationError(
    `Unsupported content type: ${contentType}`,
    'UNSUPPORTED_CONTENT_TYPE'
  );
}

/**
 * ✅ Validate request data against a schema
 * 
 * Validates request data against a schema, ensuring data integrity
 * and type safety while maintaining HATEOAS principles.
 * 
 * @param {T} data - Data to validate
 * @param {ValidationSchema} schema - Validation schema
 * @returns {T} Validated data
 * @throws {ValidationError} If validation fails
 */
export function validateRequest<T extends Record<string, unknown>>(data: T, schema: ValidationSchema): T {
  const errors: Record<string, string> = {};
  let hasErrors = false;
  
  // Simple validation against schema
  for (const [key, rule] of Object.entries(schema)) {
    const value = data[key];
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[key] = `${key} is required`;
      hasErrors = true;
      continue;
    }
    
    // Skip further validation if value is not provided and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // Type validation
    if (rule.type) {
      let typeValid = true;
      
      switch (rule.type) {
        case 'string':
          typeValid = typeof value === 'string';
          break;
        case 'number':
          typeValid = typeof value === 'number' || !isNaN(Number(value));
          break;
        case 'boolean':
          typeValid = typeof value === 'boolean' || 
                     value === 'true' || 
                     value === 'false' || 
                     value === '1' || 
                     value === '0';
          break;
        case 'array':
          typeValid = Array.isArray(value);
          break;
        case 'object':
          typeValid = typeof value === 'object' && value !== null && !Array.isArray(value);
          break;
      }
      
      if (!typeValid) {
        errors[key] = `${key} must be a ${rule.type}`;
        hasErrors = true;
        continue;
      }
    }
    
    // Check min/max for numbers
    if (rule.type === 'number' || typeof value === 'number') {
      const numValue = Number(value);
      
      if (rule.min !== undefined && numValue < rule.min) {
        errors[key] = `${key} must be at least ${rule.min}`;
        hasErrors = true;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        errors[key] = `${key} must be at most ${rule.max}`;
        hasErrors = true;
      }
    }
    
    // Check min/max length for strings
    if (rule.type === 'string' || typeof value === 'string') {
      const strValue = String(value);
      
      if (rule.minLength !== undefined && strValue.length < rule.minLength) {
        errors[key] = `${key} must be at least ${rule.minLength} characters`;
        hasErrors = true;
      }
      
      if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
        errors[key] = `${key} must be at most ${rule.maxLength} characters`;
        hasErrors = true;
      }
      
      // Check pattern
      if (rule.pattern && !new RegExp(rule.pattern).test(strValue)) {
        errors[key] = `${key} format is invalid`;
        hasErrors = true;
      }
    }
    
    // Custom validation
    if (rule.validate && typeof rule.validate === 'function') {
      const result = rule.validate(value);
      if (result !== true) {
        errors[key] = typeof result === 'string' ? result : `${key} is invalid`;
        hasErrors = true;
      }
    }
  }
  
  // Throw validation error if there are any errors
  if (hasErrors) {
    throw new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors });
  }
  
  return data;
} 