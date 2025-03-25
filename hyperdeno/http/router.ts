/**
 * 🛣️ Router for HATEOAS API
 * 
 * A web standard router that provides RESTful routing capabilities
 * based on the native Request/Response objects without external dependencies.
 * It supports HATEOAS principles by enabling resource-based routing and
 * proper HTTP method handling.
 * 
 * Key features:
 * - RESTful routing
 * - Resource-based endpoints
 * - HTTP method support
 * - Path parameter extraction
 * - Error handling
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
 * 🌐 HTTP methods supported by the router
 * 
 * Defines the standard HTTP methods supported by the router,
 * following RESTful conventions for HATEOAS APIs.
 * 
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
 * 📝 Type representing supported HTTP methods
 * 
 * Type definition for the HTTP methods supported by the router,
 * ensuring type safety in route definitions.
 * 
 * @typedef {typeof HTTP_METHODS[keyof typeof HTTP_METHODS]} HttpMethod
 */
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

/**
 * 🎯 Type definition for route handler functions
 * 
 * Defines the structure of route handler functions that process
 * incoming requests and return responses in a HATEOAS context.
 * 
 * @typedef {Function} RouteHandler
 * @param {Request} request - The incoming request object
 * @param {Record<string, string>} params - URL parameters extracted from the path
 * @returns {Promise<Response>|Response} The response to send
 */
export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response> | Response;

/**
 * 📦 Interface defining handlers for RESTful resource operations
 * 
 * Defines the standard set of handlers for RESTful resource
 * operations, following HATEOAS principles for resource
 * manipulation.
 * 
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
 * 🔧 Internal interface for route definitions
 * 
 * Defines the internal structure of route definitions,
 * including method, path pattern, and handler function.
 * 
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
 * 🎮 Router class for handling API requests
 * 
 * Main router class that manages route definitions and request
 * handling, supporting HATEOAS principles through proper
 * resource routing and error handling.
 * 
 * @class Router
 */
export class Router {
  #routes: Route[] = [];
  #notFoundHandler: RouteHandler | null = null;
  #errorHandler: ((error: Error) => Response) | null = null;
  
  /**
   * 🏗️ Creates a new Router instance with default handlers
   * 
   * Initializes a new router with default handlers for
   * 404 Not Found and error responses.
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
   * 🔄 Converts a path string to a RegExp pattern
   * 
   * Converts URL path patterns with parameters to RegExp
   * patterns for route matching.
   * 
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
   * 🔍 Extracts path parameters from a URL based on a route pattern
   * 
   * Extracts named parameters from URL paths based on
   * route patterns for use in handlers.
   * 
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
   * ➕ Adds a route to the router
   * 
   * Adds a new route definition with method, path pattern,
   * and handler function.
   * 
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
   * 📥 Adds a GET route
   * 
   * Adds a route handler for GET requests, typically used
   * for retrieving resources.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  get(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.GET, path, handler);
  }
  
  /**
   * 📤 Adds a POST route
   * 
   * Adds a route handler for POST requests, typically used
   * for creating new resources.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  post(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.POST, path, handler);
  }
  
  /**
   * 🔄 Adds a PUT route
   * 
   * Adds a route handler for PUT requests, typically used
   * for replacing entire resources.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  put(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PUT, path, handler);
  }
  
  /**
   * ✏️ Adds a PATCH route
   * 
   * Adds a route handler for PATCH requests, typically used
   * for partial resource updates.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  patch(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.PATCH, path, handler);
  }
  
  /**
   * 🗑️ Adds a DELETE route
   * 
   * Adds a route handler for DELETE requests, typically used
   * for removing resources.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  delete(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.DELETE, path, handler);
  }
  
  /**
   * ℹ️ Adds an OPTIONS route
   * 
   * Adds a route handler for OPTIONS requests, typically used
   * for CORS preflight requests.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  options(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.OPTIONS, path, handler);
  }
  
  /**
   * 👁️ Adds a HEAD route
   * 
   * Adds a route handler for HEAD requests, typically used
   * for retrieving resource metadata.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  head(path: string | RegExp, handler: RouteHandler): this {
    return this.route(HTTP_METHODS.HEAD, path, handler);
  }
  
  /**
   * 🌟 Adds a route handler for all HTTP methods
   * 
   * Adds a route handler that responds to all HTTP methods
   * on a given path.
   * 
   * @param {string|RegExp} path - The URL path pattern
   * @param {RouteHandler} handler - The request handler function
   * @returns {this} The router instance for method chaining
   */
  all(path: string | RegExp, handler: RouteHandler): this {
    return this.route('*', path, handler);
  }
  
  /**
   * ⚠️ Sets a custom 404 Not Found handler
   * 
   * Sets a custom handler for requests that don't match
   * any defined routes.
   * 
   * @param {RouteHandler} handler - The custom 404 handler
   * @returns {this} The router instance for method chaining
   */
  setNotFoundHandler(handler: RouteHandler): this {
    this.#notFoundHandler = handler;
    return this;
  }
  
  /**
   * 🚨 Sets a custom error handler
   * 
   * Sets a custom handler for processing errors that occur
   * during request handling.
   * 
   * @param {Function} handler - The custom error handler
   * @returns {this} The router instance for method chaining
   */
  setErrorHandler(handler: (error: Error) => Response): this {
    this.#errorHandler = handler;
    return this;
  }
  
  /**
   * 📦 Registers RESTful resource handlers
   * 
   * Registers a set of handlers for a RESTful resource,
   * following HATEOAS principles for resource manipulation.
   * 
   * @param {string} basePath - The base path for the resource
   * @param {ResourceHandlers} handlers - The resource handlers
   * @returns {this} The router instance for method chaining
   */
  resource(basePath: string, handlers: ResourceHandlers): this {
    // List all resources
    if (handlers.list) {
      this.get(basePath, handlers.list);
    }
    
    // Get a single resource
    if (handlers.get) {
      this.get(`${basePath}/:id`, handlers.get);
    }
    
    // Create a new resource
    if (handlers.create) {
      this.post(basePath, handlers.create);
    }
    
    // Update a resource
    if (handlers.update) {
      this.put(`${basePath}/:id`, handlers.update);
    }
    
    // Partially update a resource
    if (handlers.patch) {
      this.patch(`${basePath}/:id`, handlers.patch);
    }
    
    // Delete a resource
    if (handlers.delete) {
      this.delete(`${basePath}/:id`, handlers.delete);
    }
    
    return this;
  }
  
  /**
   * 🎯 Handles an incoming request
   * 
   * Processes an incoming request by matching it against
   * defined routes and executing the appropriate handler.
   * 
   * @param {Request} request - The incoming request
   * @returns {Promise<Response>} The response to send
   */
  async handle(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Find matching route
      for (const route of this.#routes) {
        if (route.method === '*' || route.method === request.method) {
          const match = path.match(route.path);
          if (match) {
            const params = this.#extractParams(route.path, path);
            return await route.handler(request, params);
          }
        }
      }
      
      // No matching route found
      if (this.#notFoundHandler) {
        return await this.#notFoundHandler(request, {});
      }
      
      throw new NotFoundError(`Route not found: ${request.method} ${request.url}`);
    } catch (error) {
      if (this.#errorHandler) {
        return this.#errorHandler(error as Error);
      }
      throw error;
    }
  }
} 