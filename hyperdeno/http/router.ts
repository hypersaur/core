/**
 * Router for HATEOAS API
 * 
 * A web standard router that provides RESTful routing capabilities
 * based on the native Request/Response objects without external dependencies.
 * 
 * @example
 * ```typescript
 * const router = new Router();
 * 
 * // Define routes
 * router.get('/users', async (req) => {
 *   return new Response('List users');
 * });
 * 
 * router.get('/users/:id', async (req, params) => {
 *   return new Response(`Get user ${params.id}`);
 * });
 * 
 * // Handle requests
 * const response = await router.handle(request);
 * ```
 */

import { NotFoundError } from "../core/errors.ts";
import { createErrorResponse } from "./response.ts";

/**
 * HTTP methods supported by the router
 * @constant {Object}
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

/**
 * Type representing supported HTTP methods
 * @typedef {typeof HTTP_METHODS[keyof typeof HTTP_METHODS]} HttpMethod
 */
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

/**
 * Type definition for route handler functions
 * @typedef {Function} RouteHandler
 * @param {Request} request - The incoming request object
 * @param {Record<string, string>} params - URL parameters extracted from the path
 * @returns {Promise<Response>|Response} The response to send
 */
export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response> | Response;

/**
 * Interface defining handlers for RESTful resource operations
 * @interface ResourceHandlers
 * @property {RouteHandler} [list] - Handler for GET /resource (list all)
 * @property {RouteHandler} [get] - Handler for GET /resource/:id (get one)
 * @property {RouteHandler} [create] - Handler for POST /resource (create)
 * @property {RouteHandler} [update] - Handler for PUT /resource/:id (update)
 * @property {RouteHandler} [patch] - Handler for PATCH /resource/:id (partial update)
 * @property {RouteHandler} [delete] - Handler for DELETE /resource/:id (delete)
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
 * Internal interface for route definitions
 * @interface Route
 * @property {HttpMethod|'*'} method - The HTTP method or '*' for all methods
 * @property {RegExp} path - The route path pattern
 * @property {RouteHandler} handler - The request handler function
 */
interface Route {
  method: HttpMethod | '*';
  path: RegExp;
  handler: RouteHandler;
}

/**
 * Router class for handling API requests
 * @class Router
 */
export class Router {
  #routes: Route[] = [];
  #notFoundHandler: RouteHandler | null = null;
  #errorHandler: ((error: Error) => Response) | null = null;
  
  /**
   * Creates a new Router instance with default handlers
   */
  constructor() {
    // Set default not found handler
    this.#notFoundHandler = (req) => {
      return createErrorResponse(new NotFoundError(`Route not found: ${req.method} ${req.url}`));
    };
    
    // Set default error handler
    this.#errorHandler = (err) => {
      return createErrorResponse(err);
    };
  }
  
  /**
   * Converts a path string to a RegExp pattern
   * @private
   * @param {string} path - The URL path pattern
   * @returns {RegExp} The compiled RegExp pattern
   */
  #pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\/$/, '')  // Remove trailing slash
      .replace(/:[a-zA-Z]+/g, match => {
        const paramName = match.slice(1);
        return `(?<${paramName}>[^/]+)`;
      })
      .replace(/\*/g, '.*'); // Convert * to wildcard
    return new RegExp(`^${pattern}/?$`);
  }
  
  /**
   * Extracts path parameters from a URL based on a route pattern
   * @private
   * @param {RegExp} pattern - The route pattern
   * @param {string} path - The actual URL path
   * @returns {Record<string, string>} The extracted parameters
   */
  #extractParams(pattern: RegExp, path: string): Record<string, string> {
    const match = path.match(pattern);
    if (!match?.groups) {
      return {};
    }
    return match.groups;
  }
  
  /**
   * Adds a route to the router
   * @param {HttpMethod|'*'} method - The HTTP method or '*' for all methods
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @throws {Error} If method, path, or handler is missing or invalid
   * @returns {this} The router instance for method chaining
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
   * Adds a GET route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  get(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.GET, path, handler);
  }
  
  /**
   * Adds a POST route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  post(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.POST, path, handler);
  }
  
  /**
   * Adds a PUT route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  put(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PUT, path, handler);
  }
  
  /**
   * Adds a PATCH route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  patch(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PATCH, path, handler);
  }
  
  /**
   * Adds a DELETE route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  delete(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.DELETE, path, handler);
  }
  
  /**
   * Adds an OPTIONS route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  options(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.OPTIONS, path, handler);
  }
  
  /**
   * Adds a HEAD route
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  head(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.HEAD, path, handler);
  }
  
  /**
   * Adds a route handler for all HTTP methods on a path
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  all(path: string | RegExp, handler: RouteHandler): this {
    Object.values(HTTP_METHODS).forEach(method => {
      this.route(method, path, handler);
    });
    return this;
  }
  
  /**
   * Sets a custom handler for 404 Not Found responses
   * @param {RouteHandler} handler - The not found handler function
   * @throws {Error} If handler is not a function
   * @returns {this} The router instance for method chaining
   */
  setNotFoundHandler(handler: RouteHandler): this {
    if (typeof handler !== 'function') {
      throw new Error('Not found handler must be a function');
    }
    this.#notFoundHandler = handler;
    return this;
  }
  
  /**
   * Sets a custom handler for error responses
   * @param {(error: Error) => Response} handler - The error handler function
   * @throws {Error} If handler is not a function
   * @returns {this} The router instance for method chaining
   */
  setErrorHandler(handler: (error: Error) => Response): this {
    if (typeof handler !== 'function') {
      throw new Error('Error handler must be a function');
    }
    this.#errorHandler = handler;
    return this;
  }

  /**
   * Registers RESTful resource handlers for a base path
   * @param {string} basePath - The base path for the resource
   * @param {ResourceHandlers} handlers - The resource operation handlers
   * @returns {this} The router instance for method chaining
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
   * Handles an incoming request
   * @param {Request} request - The incoming request
   * @returns {Promise<Response>} The response to send
   */
  async handle(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Find matching route
      const route = this.#routes.find(r => 
        (r.method === '*' || r.method === request.method) && 
        r.path.test(path)
      );
      
      if (!route) {
        const _error = new NotFoundError(`Route not found: ${request.method} ${request.url}`);
        return this.#notFoundHandler!(request, {});
      }
      
      // Extract parameters and call handler
      const params = this.#extractParams(route.path, path);
      const response = await route.handler(request, params);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        return this.#errorHandler!(error);
      }
      return this.#errorHandler!(new Error(String(error)));
    }
  }
} 