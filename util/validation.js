/**
 * Validation Utilities
 * 
 * Provides utilities for validating data against schemas.
 */

import { ValidationError } from '../core/errors.js';

/**
 * @typedef {Object} ValidationRule
 * @property {string} [type] - Expected type
 * @property {boolean} [required] - Whether the field is required
 * @property {number} [min] - Minimum value for numbers
 * @property {number} [max] - Maximum value for numbers
 * @property {number} [minLength] - Minimum length for strings
 * @property {number} [maxLength] - Maximum length for strings
 * @property {string} [pattern] - Regex pattern for strings
 * @property {Function} [validate] - Custom validation function
 */

/**
 * @typedef {Object.<string, ValidationRule>} ValidationSchema
 */

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {ValidationSchema} schema - Validation schema
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 */
function validate(data, schema) {
  const errors = {};
  let hasErrors = false;
  
  // Check for required fields and validate
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    
    // Check if required field is missing
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      hasErrors = true;
      continue;
    }
    
    // Skip validation if field is not required and not provided
    if ((value === undefined || value === null || value === '') && !rule.required) {
      continue;
    }
    
    // Validate field type
    if (rule.type) {
      let isValidType = true;
      
      switch (rule.type) {
        case 'string':
          isValidType = typeof value === 'string';
          break;
        case 'number':
          isValidType = typeof value === 'number' || 
                      (typeof value === 'string' && !isNaN(parseFloat(value)));
          break;
        case 'boolean':
          isValidType = typeof value === 'boolean' || 
                      value === 'true' || 
                      value === 'false' || 
                      value === 1 || 
                      value === 0 || 
                      value === '1' || 
                      value === '0';
          break;
        case 'array':
          isValidType = Array.isArray(value);
          break;
        case 'object':
          isValidType = typeof value === 'object' && 
                      value !== null && 
                      !Array.isArray(value);
          break;
      }
      
      if (!isValidType) {
        errors[field] = `${field} must be a ${rule.type}`;
        hasErrors = true;
        continue;
      }
    }
    
    // Validate minimum/maximum for numbers
    if (rule.type === 'number') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      
      if (rule.min !== undefined && numValue < rule.min) {
        errors[field] = `${field} must be at least ${rule.min}`;
        hasErrors = true;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        errors[field] = `${field} must be at most ${rule.max}`;
        hasErrors = true;
      }
    }
    
    // Validate minimum/maximum length for strings
    if (rule.type === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        hasErrors = true;
      }
      
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        hasErrors = true;
      }
      
      // Validate pattern
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        errors[field] = `${field} format is invalid`;
        hasErrors = true;
      }
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const result = rule.validate(value);
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `${field} is invalid`;
        hasErrors = true;
      }
    }
  }
  
  // Throw validation error if there are any errors
  if (hasErrors) {
    throw new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors });
  }
  
  // Return validated data (with type conversions)
  const validatedData = { ...data };
  
  // Convert types as needed
  for (const [field, rule] of Object.entries(schema)) {
    const value = validatedData[field];
    
    // Skip if no value
    if (value === undefined || value === null) {
      continue;
    }
    
    // Convert to proper type
    if (rule.type === 'number' && typeof value === 'string') {
      validatedData[field] = parseFloat(value);
    } else if (rule.type === 'boolean' && typeof value === 'string') {
      validatedData[field] = value === 'true' || value === '1';
    }
  }
  
  return validatedData;
}

/**
 * Create a validation middleware
 * @param {ValidationSchema} schema - Validation schema
 * @param {string} [source='body'] - Data source (body, query, params)
 * @returns {Function} Middleware function
 */
function validateMiddleware(schema, source = 'body') {
  return async (request) => {
    let data;
    
    switch (source) {
      case 'body':
        data = await parseBody(request);
        break;
      case 'query':
        data = Object.fromEntries(new URL(request.url).searchParams);
        break;
      case 'params':
        data = request.params;
        break;
      default:
        throw new Error(`Invalid validation source: ${source}`);
    }
    
    // Validate data against schema
    const validated = validate(data, schema);
    
    // Attach validated data to request
    const enhancedRequest = Object.create(request, {
      validated: {
        value: validated,
        writable: false
      }
    });
    
    return enhancedRequest;
  };
}

export { validate, validateMiddleware };