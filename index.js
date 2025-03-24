/**
 * HyperDeno Framework
 * 
 * A lightweight, standards-based HATEOAS framework for building 
 * hypermedia-driven APIs using web standard technologies.
 * 
 * @module hyperdeno
 */

// Core components
export { Resource } from './core/resource.js';
export { Collection } from './core/collection.js';
export { LinkManager, STANDARD_RELS } from './core/link.js';
export { ResourceState } from './core/state.js';
export { 
  ApiError,
  NotFoundError,
  ValidationError,
  InvalidArgumentError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  StateTransitionError,
  ContentNegotiationError,
  Errors,
  createErrorResponse
} from './core/errors.js';

// HTTP components
export { Router, HTTP_METHODS } from './http/router.js';
export { 
  parsePath, 
  parseQuery, 
  parseJSON, 
  parseFormData, 
  parseBody, 
  validateRequest 
} from './http/request.js';
export { 
  createResponse, 
  createJsonResponse, 
  createTextResponse, 
  createHtmlResponse, 
  createRedirectResponse,
  addHateoasHeaders
} from './http/response.js';
export { 
  MEDIA_TYPES,
  FORMAT_MAP,
  parseAcceptHeader,
  getBestMatch,
  getMediaTypeFromFormat,
  negotiateContentType
} from './http/content-type.js';

// Rendering components
export { Renderer } from './rendering/renderer.js';
export { JsonRenderer } from './rendering/json-renderer.js';
export { HalRenderer } from './rendering/hal-renderer.js';

/**
 * @typedef {Object} ServerOptions
 * @property {number} [port=3000] - Port to listen on
 * @property {string} [host='localhost'] - Host to bind to
 * @property {boolean} [cors=true] - Whether to enable CORS
 * @property {boolean} [logging=true] - Whether to enable request logging
 */

/**
 * Create a new HATEOAS API application
 * @param {ServerOptions} [options] - Application options
 * @returns {Object} Application object with server and router
 */
export function createApp(options = {}) {
  // Default options
  const appOptions = {
    port: 3000,
    host: 'localhost',
    cors: true,
    logging: true,
    ...options
  };
  
  // Create router
  const router = new Router();
  
  // Array to store middleware
  const middleware = [];
  
  // Add default middleware if enabled
  if (appOptions.logging) {
    middleware.push(loggingMiddleware);
  }
  
  if (appOptions.cors) {
    middleware.push(corsMiddleware);
  }
  
  // Server instance
  let server = null;
  
  // The application object
  const app = {
    router,
    
    /**
     * Add middleware to the server
     * @param {Function} fn - Middleware function
     * @returns {Object} Application object for chaining
     */
    use(fn) {
      if (typeof fn !== 'function') {
        throw new Error('Middleware must be a function');
      }
      middleware.push(fn);
      return this;
    },
    
    /**
     * Start the server
     * @returns {Promise<void>} Promise that resolves when the server is started
     */
    async start() {
      if (server) {
        return; // Server already running
      }
      
      const { port, host } = appOptions;
      
      server = Deno.serve({ port, hostname: host }, handleRequest);
      
      console.log(`Server running at http://${host}:${port}`);
    },
    
    /**
     * Stop the server
     * @returns {Promise<void>} Promise that resolves when the server is stopped
     */
    async stop() {
      if (!server) {
        return; // Server not running
      }
      
      await server.shutdown();
      server = null;
      
      console.log('Server stopped');
    }
  };
  
  /**
   * Handle an incoming request
   * @param {Request} request - Web standard Request
   * @returns {Promise<Response>} Web standard Response
   */
  async function handleRequest(request) {
    try {
      // Run through middleware
      let currentRequest = request;
      for (const fn of middleware) {
        const result = await fn(currentRequest);
        
        // If middleware returns a response, return it
        if (result instanceof Response) {
          return addHateoasHeaders(result);
        }
        
        // If middleware modifies the request, use the modified version
        if (result instanceof Request) {
          currentRequest = result;
        }
      }
      
      // Handle the request with the router
      const response = await router.handle(currentRequest);
      
      // Add HATEOAS headers
      return addHateoasHeaders(response);
    } catch (error) {
      // Log error
      console.error('Server error:', error);
      
      // Create error response
      return addHateoasHeaders(createErrorResponse(error));
    }
  }
  
  return app;
}

/**
 * Logging middleware
 * @param {Request} request - Web standard Request
 * @returns {Request} The original request
 * @private
 */
function loggingMiddleware(request) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  
  console.log(`[${timestamp}] ${method} ${url}`);
  
  // Measure response time
  const startTime = performance.now();
  
  // Log when response is complete
  request.signal.addEventListener('abort', () => {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    console.log(`[${timestamp}] ${method} ${url} - Completed in ${duration}ms`);
  });
  
  return request;
}

/**
 * CORS middleware
 * @param {Request} request - Web standard Request
 * @returns {Request|Response} The request or a preflight response
 * @private
 */
function corsMiddleware(request) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      }
    });
  }
  
  // For regular requests, just pass through
  return request;
}