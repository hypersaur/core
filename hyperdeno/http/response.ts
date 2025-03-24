/**
 * Response utilities for HATEOAS API
 * 
 * Helper functions for creating web standard Response objects
 * with proper content types and status codes.
 */

import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';
import { NotFoundError } from '../core/errors.ts';

/**
 * Response options interface
 */
export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Create a response with appropriate content type and status
 * @param data - Response data
 * @param options - Response options
 * @returns Web standard Response
 */
export function createResponse(data: unknown, options: ResponseOptions = {}): Response {
  // Default response options
  const defaultOptions: ResponseOptions = {
    status: 200,
    headers: {}
  };
  
  // Merge options
  const finalOptions: ResponseOptions = { 
    ...defaultOptions, 
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers } 
  };
  
  // Handle null/undefined for 204 No Content
  if (data === null || data === undefined) {
    return new Response(null, {
      status: finalOptions.status || 204,
      headers: finalOptions.headers
    });
  }
  
  // Handle Resource/Collection objects
  if (data instanceof Resource || data instanceof Collection) {
    return createJsonResponse(data.toJSON(), finalOptions);
  }
  
  // Handle different data types
  if (typeof data === 'object') {
    return createJsonResponse(data, finalOptions);
  }
  
  if (typeof data === 'string') {
    return createTextResponse(data, finalOptions);
  }
  
  // For other types, convert to string
  return createTextResponse(String(data), finalOptions);
}

/**
 * Create a JSON response
 * @param data - JSON data
 * @param options - Response options
 * @returns Web standard Response
 */
export function createJsonResponse(data: unknown, options: ResponseOptions = {}): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers
  });
}

/**
 * Create a text response
 * @param text - Text content
 * @param options - Response options
 * @returns Web standard Response
 */
export function createTextResponse(text: string, options: ResponseOptions = {}): Response {
  const headers = {
    'Content-Type': 'text/plain',
    ...options.headers
  };
  
  return new Response(text, {
    status: options.status || 200,
    headers
  });
}

/**
 * Create an HTML response
 * @param html - HTML content
 * @param options - Response options
 * @returns Web standard Response
 */
export function createHtmlResponse(html: string, options: ResponseOptions = {}): Response {
  const headers = {
    'Content-Type': 'text/html',
    ...options.headers
  };
  
  return new Response(html, {
    status: options.status || 200,
    headers
  });
}

/**
 * Create a redirect response
 * @param url - Redirect URL
 * @param permanent - Whether the redirect is permanent
 * @returns Web standard Response
 */
export function createRedirectResponse(url: string, permanent = false): Response {
  return new Response(null, {
    status: permanent ? 301 : 302,
    headers: {
      'Location': url
    }
  });
}

/**
 * Add standard HATEOAS headers to a response
 * @param response - Web standard Response
 * @returns Enhanced response with HATEOAS headers
 */
export function addHateoasHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  // Add CORS headers for API accessibility
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  
  // Add Vary header for proper caching
  newHeaders.set('Vary', 'Accept');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Create an error response with appropriate status code and format
 * @param error - Error object
 * @returns Web standard Response with error details
 */
export function createErrorResponse(error: Error): Response {
  let status = 500;
  let code = 'INTERNAL_ERROR';

  if (error instanceof NotFoundError) {
    status = 404;
    code = 'NOT_FOUND';
  }

  const errorResponse = {
    status,
    code,
    message: error.message
  };

  return createJsonResponse(errorResponse, { status });
} 