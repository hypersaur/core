/**
 * Response utilities for HATEOAS API
 * 
 * Helper functions for creating web standard Response objects
 * with proper content types and status codes.
 */

import { Resource } from '../core/resource.js';
import { Collection } from '../core/collection.js';

/**
 * @typedef {Object} ResponseOptions
 * @property {number} [status=200] - HTTP status code
 * @property {Object} [headers={}] - Response headers
 */

/**
 * Create a response with appropriate content type and status
 * @param {*} data - Response data
 * @param {ResponseOptions} [options] - Response options
 * @returns {Response} Web standard Response
 */
function createResponse(data, options = {}) {
  // Default response options
  const defaultOptions = {
    status: 200,
    headers: {}
  };
  
  // Merge options
  const finalOptions = { 
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
 * @param {Object} data - JSON data
 * @param {ResponseOptions} [options] - Response options
 * @returns {Response} Web standard Response
 */
function createJsonResponse(data, options = {}) {
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
 * @param {string} text - Text content
 * @param {ResponseOptions} [options] - Response options
 * @returns {Response} Web standard Response
 */
function createTextResponse(text, options = {}) {
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
 * @param {string} html - HTML content
 * @param {ResponseOptions} [options] - Response options
 * @returns {Response} Web standard Response
 */
function createHtmlResponse(html, options = {}) {
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
 * @param {string} url - Redirect URL
 * @param {boolean} [permanent=false] - Whether the redirect is permanent
 * @returns {Response} Web standard Response
 */
function createRedirectResponse(url, permanent = false) {
  return new Response(null, {
    status: permanent ? 301 : 302,
    headers: {
      'Location': url
    }
  });
}

/**
 * Add standard HATEOAS headers to a response
 * @param {Response} response - Web standard Response
 * @returns {Response} Enhanced response with HATEOAS headers
 */
function addHateoasHeaders(response) {
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

export {
  createResponse,
  createJsonResponse,
  createTextResponse,
  createHtmlResponse,
  createRedirectResponse,
  addHateoasHeaders
};