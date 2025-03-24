/**
 * Router for HATEOAS API
 * 
 * A web standard router that provides RESTful routing capabilities
 * based on the native Request/Response objects without external dependencies.
 */

import { parsePath } from './request.ts';
import { createResponse } from './response.ts';
import { createErrorResponse, NotFoundError, ApiError } from '../core/errors.ts';

/**
 * HTTP methods supported by the router
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
} as const;

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

/**
 * Route handler function type
 */
export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response> | Response;

/**
 * Resource handlers interface
 */
export interface ResourceHandlers {
  list?: RouteHandler;
  get?: RouteHandler;
  create?: RouteHandler;
  update?: RouteHandler;
  patch?: RouteHandler;
  delete?: RouteHandler;
}

/**
 * Route definition interface
 */
interface Route {
  method: HttpMethod | '*';
  path: RegExp;
  handler: RouteHandler;
}

/**
 * Router class for handling API requests
 */
export class Router {
  #routes: Route[] = [];
  #notFoundHandler: RouteHandler | null = null;
  #errorHandler: ((error: Error) => Response) | null = null;
  
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
   * Convert path string to RegExp
   * @param path - URL path pattern
   * @returns RegExp pattern
   */
  #pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*');
    
    return new RegExp(`^${pattern}$`);
  }
  
  /**
   * Extract path parameters from URL
   * @param pattern - Route pattern
   * @param path - Actual URL path
   * @returns Path parameters
   */
  #extractParams(pattern: RegExp, path: string): Record<string, string> {
    const match = path.match(pattern);
    if (!match) {
      return {};
    }
    
    const params: Record<string, string> = {};
    const paramNames = pattern.toString()
      .match(/:[^/]+/g)
      ?.map(name => name.slice(1)) || [];
    
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });
    
    return params;
  }
  
  /**
   * Add a route to the router
   * @param method - HTTP method
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  route(method: HttpMethod | '*', path: string | RegExp, handler: RouteHandler): this {
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
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  get(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.GET, path, handler);
  }
  
  /**
   * Add a POST route
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  post(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.POST, path, handler);
  }
  
  /**
   * Add a PUT route
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  put(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PUT, path, handler);
  }
  
  /**
   * Add a PATCH route
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  patch(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PATCH, path, handler);
  }
  
  /**
   * Add a DELETE route
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  delete(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.DELETE, path, handler);
  }
  
  /**
   * Add an OPTIONS route
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  options(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.OPTIONS, path, handler);
  }
  
  /**
   * Add a HEAD route
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  head(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.HEAD, path, handler);
  }
  
  /**
   * Define a handler for all HTTP methods on a path
   * @param path - URL path pattern
   * @param handler - Request handler
   * @returns Router instance for chaining
   */
  all(path: string | RegExp, handler: RouteHandler): this {
    Object.values(HTTP_METHODS).forEach(method => {
      this.route(method, path, handler);
    });
    return this;
  }
  
  /**
   * Set the not found handler
   * @param handler - Not found handler
   * @returns Router instance for chaining
   */
  setNotFoundHandler(handler: RouteHandler): this {
    if (typeof handler !== 'function') {
      throw new Error('Not found handler must be a function');
    }
    this.#notFoundHandler = handler;
    return this;
  }
  
  /**
   * Set the error handler
   * @param handler - Error handler
   * @returns Router instance for chaining
   */
  setErrorHandler(handler: (error: Error) => Response): this {
    if (typeof handler !== 'function') {
      throw new Error('Error handler must be a function');
    }
    this.#errorHandler = handler;
    return this;
  }
  
  /**
   * Define resource routes for CRUD operations
   * @param basePath - Base path for the resource
   * @param handlers - Resource handlers
   * @returns Router instance for chaining
   */
  resource(basePath: string, handlers: ResourceHandlers): this {
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
   * @param request - Web standard Request object
   * @returns Promise resolving to a Response
   */
  async handle(request: Request): Promise<Response> {
    try {
      const method = request.method as HttpMethod;
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
        const enhancedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          mode: request.mode,
          credentials: request.credentials,
          cache: request.cache,
          redirect: request.redirect,
          referrer: request.referrer,
          referrerPolicy: request.referrerPolicy,
          integrity: request.integrity
        });
        
        // Add params to request
        Object.defineProperty(enhancedRequest, 'params', {
          value: params,
          writable: false
        });
        
        // Handle the request
        return await route.handler(enhancedRequest, params);
      }
      
      // No matching route found
      if (this.#notFoundHandler) {
        return await this.#notFoundHandler(request, {});
      }
      
      throw new NotFoundError(`Route not found: ${method} ${pathname}`);
    } catch (error) {
      if (this.#errorHandler) {
        return this.#errorHandler(error instanceof Error ? error : new Error(String(error)));
      }
      
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 