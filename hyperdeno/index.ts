/**
 * HyperDeno - A HATEOAS API Framework for Deno
 * 
 * This is the main entry point for the HyperDeno framework.
 * It provides a clean API for creating HATEOAS-compliant REST APIs.
 */

import { Server } from './server.ts';
import type { Resource } from './core/resource.ts';
import { Router } from './http/router.ts';
import type { RendererFactory } from './rendering/renderer_factory.ts';

export { Resource } from './core/resource.ts';
export { Collection } from './core/collection.ts';
export { Router } from './http/router.ts';
export { RendererFactory } from './rendering/renderer_factory.ts';
export { Server } from './server.ts';

/**
 * Create a new HyperDeno application
 * @returns A new application instance
 */
export function createApp(): {
  getRouter: () => Router;
  setRendererFactory: (factory: RendererFactory) => void;
  handle: (request: Request) => Promise<Response>;
} {
  const router = new Router();
  let rendererFactory: RendererFactory | null = null;
  
  return {
    getRouter: () => router,
    setRendererFactory: (factory: RendererFactory) => {
      rendererFactory = factory;
    },
    handle: async (request: Request): Promise<Response> => {
      const response = await router.handle(request);
      
      // If we have a renderer factory and the response contains a resource,
      // use the factory to render it
      if (rendererFactory && response.body instanceof Resource) {
        const acceptHeader = request.headers.get('accept') || '';
        return rendererFactory.render(response.body, acceptHeader);
      }
      
      return response;
    }
  };
}

/**
 * Create a new server instance
 * @param options - Server options
 * @returns A new server instance
 */
export function createServer(options = {}): Server {
  return new Server(options);
} 