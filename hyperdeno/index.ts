/**
 * HyperDeno Framework
 * 
 * A lightweight, standards-based HATEOAS framework for building 
 * hypermedia-driven APIs using web standard technologies.
 * 
 * @module hyperdeno
 */

import { Router } from "../index.ts";

// Core components
export { Resource } from './core/resource.ts';
export { Collection } from './core/collection.ts';
export { LinkManager, STANDARD_RELS } from './core/link.ts';
export { ResourceState } from './core/state.ts';
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
} from './core/errors.ts';

export interface ServerOptions {
  port?: number;
  host?: string;
  cors?: boolean;
  logging?: boolean;
}

type MiddlewareFunction = (request: Request) => Promise<Request | Response> | Request | Response;

/**
 * Server class - Core component for handling HTTP communication
 */
class Server {
  private router: Router;
  private options: Required<ServerOptions>;
  private server: any = null;
  private middleware: MiddlewareFunction[] = [];
  
  /**
   * Create a new server instance
   * @param options - Server options
   * @param router - Router instance
   */
  constructor(options: ServerOptions, router: Router) {
    this.router = router;
    this.options = {
      port: 3000,
      host: 'localhost',
      cors: true,
      logging: true,
      ...options
    };
    
    // Add default middleware
    if (this.options.logging) {
      this.middleware.push(this.loggingMiddleware.bind(this));
    }
    
    if (this.options.cors) {
      this.middleware.push(this.corsMiddleware.bind(this));
    }
  }
  
  /**
   * Add middleware to the server
   * @param middleware - Middleware function
   * @returns Server instance for chaining
   */
  use(middleware: MiddlewareFunction): Server {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    
    this.middleware.push(middleware);
    return this;
  }
  
  /**
   * Start the server
   * @returns Promise that resolves when the server is started
   */
  async start(): Promise<void> {
    if (this.server) {
      return; // Server already running
    }
    
    const { port, host } = this.options;
    
    this.server = Deno.serve({ port, hostname: host }, this.handleRequest.bind(this));
    
    console.log(`Server running at http://${host}:${port}`);
  }
  
  /**
   * Stop the server
   * @returns Promise that resolves when the server is stopped
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return; // Server not running
    }
    
    await this.server.shutdown();
    this.server = null;
    
    console.log('Server stopped');
  }
  
  /**
   * Handle an incoming request
   * @param request - Web standard Request
   * @returns Promise<Response> Web standard Response
   * @private
   */
  private async handleRequest(request: Request): Promise<Response> {
    try {
      // Run through middleware
      let currentRequest = request;
      for (const middleware of this.middleware) {
        const result = await middleware(currentRequest);
        
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
      const response = await this.router.handle(currentRequest);
      
      // Add HATEOAS headers
      return addHateoasHeaders(response);
    } catch (error) {
      // Log error
      console.error('Server error:', error);
      
      // Create error response
      return addHateoasHeaders(createErrorResponse(error));
    }
  }
  
  /**
   * Logging middleware
   * @param request - Web standard Request
   * @returns The original request
   * @private
   */
  private loggingMiddleware(request: Request): Request {
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
   * @param request - Web standard Request
   * @returns The request or a preflight response
   * @private
   */
  private corsMiddleware(request: Request): Request | Response {
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
}

interface App {
  server: Server;
  router: Router;
  use: (middleware: MiddlewareFunction) => App;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Create a new HATEOAS API application
 * @param options - Application options
 * @returns Application object with server and router
 */
export function createApp(options: ServerOptions = {}): App {
  // Create router
  const router = new Router();
  
  // Create server with the router
  const server = new Server(options, router);
  
  return {
    server,
    router,
    use(middleware: MiddlewareFunction): App {
      server.use(middleware);
      return this;
    },
    async start(): Promise<void> {
      await server.start();
    },
    async stop(): Promise<void> {
      await server.stop();
    }
  };
} 