/**
 * Router for HATEOAS API
 * 
 * A web standard router that provides RESTful routing capabilities
 * based on the native Request/Response objects without external dependencies.
 */

import { parsePath } from './request.js';
import { createResponse } from './response.js';
import { createErrorResponse, NotFoundError, ApiError } from '../core/errors.js';

/**
 * HTTP methods supported by the router
 */
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
};

/**
 * Router class for handling API requests
 */
class Router {
  #routes = [];
  #notFoundHandler = null;
  #errorHandler = null;
  
  /**
   * Create a new router
   */
  constructor() {
    // Set default not found handler
    this.#notFoundHandler = (req) => {
      const error = new NotFoundError(`Route not found: ${req.method} ${req.url}`);
      return createErrorResponse(error);
    };
    
    // Set default error handler
    this.#errorHandler = (err) => {
      return createErrorResponse(err);
    };
  }
  
  /**
   * Add a route to the router
   * @param {string} method - HTTP method
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  route(method, path, handler) {
    if (!method || !path || !handler) {
      throw new Error('Method, path, and handler are required');
    }
    
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    // Convert path string to RegExp if it's not already
    const pathPattern = typeof path === 'string'
      ? this.#pathToRegex(path)
      : path;
    
    this.#routes.push({
      method,
      path: pathPattern,
      handler
    });
    
    return this;
  }
  
  /**
   * Add a GET route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  get(path, handler) {
    return this.route(HTTP_METHODS.GET, path, handler);
  }
  
  /**
   * Add a POST route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  post(path, handler) {
    return this.route(HTTP_METHODS.POST, path, handler);
  }
  
  /**
   * Add a PUT route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  put(path, handler) {
    return this.route(HTTP_METHODS.PUT, path, handler);
  }
  
  /**
   * Add a PATCH route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  patch(path, handler) {
    return this.route(HTTP_METHODS.PATCH, path, handler);
  }
  
  /**
   * Add a DELETE route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  delete(path, handler) {
    return this.route(HTTP_METHODS.DELETE, path, handler);
  }
  
  /**
   * Add an OPTIONS route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  options(path, handler) {
    return this.route(HTTP_METHODS.OPTIONS, path, handler);
  }
  
  /**
   * Add a HEAD route
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  head(path, handler) {
    return this.route(HTTP_METHODS.HEAD, path, handler);
  }
  
  /**
   * Define a handler for all HTTP methods on a path
   * @param {string|RegExp} path - URL path pattern
   * @param {Function} handler - Request handler
   * @returns {Router} For chaining
   */
  all(path, handler) {
    Object.values(HTTP_METHODS).forEach(method => {
      this.route(method, path, handler);
    });
    return this;
  }
  
  /**
   * Set the not found handler
   * @param {Function} handler - Not found handler
   * @returns {Router} For chaining
   */
  setNotFoundHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Not found handler must be a function');
    }
    this.#notFoundHandler = handler;
    return this;
  }
  
  /**
   * Set the error handler
   * @param {Function} handler - Error handler
   * @returns {Router} For chaining
   */
  setErrorHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Error handler must be a function');
    }
    this.#errorHandler = handler;
    return this;
  }
  
  /**
   * Define resource routes for CRUD operations
   * @param {string} basePath - Base path for the resource
   * @param {Object} handlers - Resource handlers
   * @returns {Router} For chaining
   */
  resource(basePath, handlers) {
    const path = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const itemPath = `${path}/:id`;
    
    if (handlers.list) {
      this.get(path, handlers.list);
    }
    
    if (handlers.get) {
      this.get(itemPath, handlers.get);
    }
    
    if (handlers.create) {
      this.post(path, handlers.create);
    }
    
    if (handlers.update) {
      this.put(itemPath, handlers.update);
    }
    
    if (handlers.patch) {
      this.patch(itemPath, handlers.patch);
    }
    
    if (handlers.delete) {
      this.delete(itemPath, handlers.delete);
    }
    
    return this;
  }
  
  /**
   * Handle a request
   * @param {Request} request - Web standard Request object
   * @returns {Promise<Response>} Web standard Response object
   */
  async handle(request) {
    try {
      const method = request.method;
      const url = new URL(request.url);
      const pathname = url.pathname;
      
      // Find matching route
      for (const route of this.#routes) {
        if (route.method !== method && route.method !== '*') {
          continue;
        }
        
        const match = pathname.match(route.path);
        if (!match) {
          continue;
        }
        
        // Parse path parameters
        const params = this.#extractParams(route.path, pathname);
        
        // Create enhanced request with parsed data
        const enhancedRequest = Object.create(request, {
          params: {
            value: params,
            writable: false
          },
          query: {
            value: Object.fromEntries(url.searchParams),
            writable: false
          },
          path: {
            value: pathname,
            writable: false
          }
        });
        
        // Call the route handler
        try {
          const result = await route.handler(enhancedRequest);
          
          // Handle different types of results
          if (result instanceof Response) {
            return result;
          }
          
          // Handle undefined/null (for DELETE methods usually)
          if (result === undefined || result === null) {
            return createResponse(null, {
              status: method === 'DELETE' ? 204 : 200
            });
          }
          
          // Handle other result types
          return createResponse(result);
        } catch (err) {
          return this.#errorHandler(err);
        }
      }
      
      // No route found
      return this.#notFoundHandler(request);
    } catch (err) {
      return this.#errorHandler(err);
    }
  }
  
  /**
   * Convert a path string to a RegExp pattern
   * @param {string} path - URL path pattern
   * @returns {RegExp} RegExp pattern
   * @private
   */
  #pathToRegex(path) {
    // Replace parameter placeholders with regex groups
    const pattern = path
      .replace(/\//g, '\\/') // Escape forward slashes
      .replace(/:\w+/g, '([^/]+)'); // Replace :param with capture groups
    
    return new RegExp(`^${pattern}$`);
  }
  
  /**
   * Extract parameters from a path
   * @param {RegExp} pattern - Path pattern regex
   * @param {string} path - URL path
   * @returns {Object} Path parameters
   * @private
   */
  #extractParams(pattern, path) {
    if (!(pattern instanceof RegExp)) {
      return {};
    }
    
    const params = {};
    const paramNames = [];
    
    // Extract parameter names from the original pattern string
    let paramNameMatch;
    const PARAM_REGEX = /:(\w+)/g;
    
    // We need to get the original pattern string from which the RegExp was created
    const patternSource = pattern.toString().slice(1, -1); // Remove / at start and end
    
    while ((paramNameMatch = PARAM_REGEX.exec(patternSource)) !== null) {
      paramNames.push(paramNameMatch[1]);
    }
    
    // Match values from the path
    const match = path.match(pattern);
    if (!match) {
      return params;
    }
    
    // Skip the first match (the full string match)
    const values = match.slice(1);
    
    // Create parameter object
    paramNames.forEach((name, index) => {
      if (index < values.length) {
        params[name] = values[index];
      }
    });
    
    return params;
  }
}

export { Router, HTTP_METHODS };