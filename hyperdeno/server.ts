/**
 * HyperDeno server implementation
 * 
 * This file contains the main server implementation that uses the server abstraction
 * to provide a framework-agnostic HTTP server.
 */

import { Router } from './http/router.ts';
import { RendererFactory } from './rendering/renderer_factory.ts';
import { type createResponse, createErrorResponse } from './http/response.ts';
import { ApiError } from './core/errors.ts';
import type { Server as ServerInterface, ServerOptions as BaseServerOptions } from './servers/types.ts';
import { DenoServer } from './servers/deno_server.ts';

export interface ServerOptions extends BaseServerOptions {
  rendererFactory?: RendererFactory;
}

export class Server {
  private rendererFactory: RendererFactory;
  private router: Router;
  private server: ServerInterface;

  /**
   * Creates a new server instance
   * @param {ServerOptions} options - Server configuration options
   */
  constructor(options: ServerOptions = {}) {
    const { rendererFactory, ...serverOptions } = options;
    this.router = new Router();
    this.rendererFactory = rendererFactory || new RendererFactory();
    
    // Create the appropriate server implementation
    this.server = new DenoServer(this.handle.bind(this));
  }

  /**
   * Starts the server
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    await this.server.start();
    console.log(`Server running at http://${this.server.getStatus() === 'running' ? 'localhost:8000' : 'stopped'}`);
  }

  /**
   * Handle a request
   * @param request - The request to handle
   * @returns The response
   */
  async handle(request: Request): Promise<Response> {
    try {
      const response = await this.router.handle(request);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }
      return createErrorResponse(error instanceof Error ? error : new Error('Internal Server Error'));
    }
  }

  /**
   * Gets the router instance
   * @returns {Router} The router instance
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Gets the renderer factory instance
   * @returns {RendererFactory} The renderer factory instance
   */
  getRendererFactory(): RendererFactory {
    return this.rendererFactory;
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    await this.server.stop();
    console.log('Server stopped');
  }
} 