/**
 * HyperDeno - A HATEOAS API Framework for Deno
 * 
 * This is the main entry point for the HyperDeno framework.
 * It provides a clean API for creating HATEOAS-compliant REST APIs.
 */

import { Server } from './server.ts';
import { Resource } from './core/resource.ts';
import { Collection } from './core/collection.ts';
import { Router } from './http/router.ts';
import { JsonRenderer } from './rendering/json-renderer.ts';
import { HtmlRenderer } from './rendering/html-renderer.ts';
import { ContentNegotiator } from './rendering/negotiation.ts';

export { Resource } from './core/resource.ts';
export { Collection } from './core/collection.ts';
export { Router } from './http/router.ts';
export { JsonRenderer } from './rendering/json-renderer.ts';
export { HtmlRenderer } from './rendering/html-renderer.ts';
export { ContentNegotiator } from './rendering/negotiation.ts';
export { Server } from './server.ts';

/**
 * Create a new HyperDeno application
 * @returns A new application instance
 */
export function createApp() {
  const router = new Router();
  const jsonRenderer = new JsonRenderer();
  const htmlRenderer = new HtmlRenderer();
  const negotiator = new ContentNegotiator();
  
  negotiator.addRenderers([jsonRenderer, htmlRenderer]);
  
  return {
    getRouter: () => router,
    setContentNegotiator: (negotiator: ContentNegotiator) => {
      // Store the negotiator for later use
    },
    handle: async (request: Request): Promise<Response> => {
      const response = await router.handle(request);
      return response;
    }
  };
}

/**
 * Create a new server instance
 * @param options - Server options
 * @returns A new server instance
 */
export function createServer(options = {}) {
  return new Server(options);
} 