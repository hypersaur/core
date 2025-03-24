/**
 * Request utilities for HATEOAS API
 * 
 * Provides helper functions for working with web standard Request objects.
 */

import { ValidationError } from '../core/errors.js';

/**
 * Parse URL path parameters
 * @param {string} pattern - URL pattern with parameter placeholders
 * @param {string} path - Actual URL path
 * @returns {Object} Path parameters
 */
function parsePath(pattern, path) {
  const params = {};
  
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
 * Parse query parameters from a request URL
 * @param {Request} request - Web standard Request object
 * @returns {Object} Query parameters
 */
function parseQuery(request) {
  const url = new URL(request.url);
  const query = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }
  
  return query;
}

/**
 * Parse JSON request body
 * @param {Request} request - Web standard Request object
 * @returns {Promise<Object>} Parsed JSON body
 * @throws {ValidationError} If JSON is invalid
 */
async function parseJSON(request) {
  try {
    return await request.json();
  } catch (err) {
    throw new ValidationError('Invalid JSON in request body', 'INVALID_JSON', {
      message: err.message
    });
  }
}

/**
 * Parse form data from request body
 * @param {Request} request - Web standard Request object
 * @returns {Promise<Object>} Parsed form data
 */
async function parseFormData(request) {
  const formData = await request.formData();
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
}

/**
 * Parse request body based on content type
 * @param {Request} request - Web standard Request object
 * @returns {Promise<Object>} Parsed body
 * @throws {ValidationError} If content type is unsupported
 */
async function parseBody(request) {
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
 * Validate request data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 */
function validateRequest(data, schema) {
  const errors = {};
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
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors[key] = `${key} must be at least ${rule.minLength} characters`;
        hasErrors = true;
      }
      
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors[key] = `${key} must be at most ${rule.maxLength} characters`;
        hasErrors = true;
      }
      
      // Check pattern
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        errors[key] = `${key} has an invalid format`;
        hasErrors = true;
      }
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const validationResult = rule.validate(value);
      if (validationResult !== true) {
        errors[key] = typeof validationResult === 'string' 
          ? validationResult 
          : `${key} is invalid`;
        hasErrors = true;
      }
    }
  }
  
  if (hasErrors) {
    throw new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors });
  }
  
  return data;
}

export {
  parsePath,
  parseQuery,
  parseJSON,
  parseFormData,
  parseBody,
  validateRequest
};