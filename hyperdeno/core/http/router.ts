/**
 * 🛣️ HTTP Router for HATEOAS Framework
 * 
 * This router integrates with the HATEOAS resource system, using the resource's
 * link definitions to handle routing. It provides a bridge between HTTP requests
 * and resource-based routing.
 */

import { validate } from '../validation.ts';
import { Resource } from '../resource.ts';
import { createErrorResponse } from '../errors.ts';

/**
 * 📝 Route handler type that works with HATEOAS resources
 */
export type ResourceHandler = (request: Request) => Promise<Resource>;

/**
 * 📝 Resource route definition
 */
export interface ResourceRoute {
  path: string;
  handler: ResourceHandler;
}

/**
 * 🎯 Resource-based Router class
 */
export class ResourceRouter {
  private routes: Map<string, ResourceHandler> = new Map();

  /**
   * 🎨 Register a resource route
   */
  addRoute(path: string, handler: ResourceHandler): this {
    this.routes.set(path, handler);
    return this;
  }

  /**
   * 🔍 Find matching route for the request
   */
  private findRoute(path: string): ResourceHandler | undefined {
    return this.routes.get(path);
  }

  /**
   * 🎯 Handle incoming request
   */
  async handle(request: Request): Promise<Response> {
    try {
      // Validate request
      validate.request(request);

      // Find matching route
      const path = new URL(request.url).pathname;
      const handler = this.findRoute(path);
      
      if (!handler) {
        return new Response('Not Found', { status: 404 });
      }

      // Handle request and get resource
      const resource = await handler(request);
      
      // Return resource as JSON response
      return new Response(JSON.stringify(resource.toJSON()), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }
}

/**
 * 🎨 Convenience methods for resource routing
 */
export const router = {
  create: () => new ResourceRouter(),
  
  /**
   * Add a GET route that returns a resource
   */
  get: (router: ResourceRouter, path: string, handler: ResourceHandler) => 
    router.addRoute(path, handler),
    
  /**
   * Add a POST route that creates a resource
   */
  post: (router: ResourceRouter, path: string, handler: ResourceHandler) => 
    router.addRoute(path, handler),
    
  /**
   * Add a PUT route that updates a resource
   */
  put: (router: ResourceRouter, path: string, handler: ResourceHandler) => 
    router.addRoute(path, handler),
    
  /**
   * Add a DELETE route that removes a resource
   */
  delete: (router: ResourceRouter, path: string, handler: ResourceHandler) => 
    router.addRoute(path, handler)
}; 