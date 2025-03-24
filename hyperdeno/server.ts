/**
 * Deno server implementation for HyperDeno
 * 
 * This file contains the Deno-specific server implementation, keeping it separate
 * from the core framework code to allow for different server implementations.
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createApp, Resource, Collection } from './index.ts';
import { Router } from './http/router.ts';
import { RendererFactory } from './rendering/renderer_factory.ts';
import { createResponse } from './http/response.ts';
import { ApiError } from './core/errors.ts';

export interface ServerOptions {
  port?: number;
  hostname?: string;
  rendererFactory?: RendererFactory;
}

export class Server {
  private port: number;
  private hostname: string;
  private server: AbortController | null = null;
  private rendererFactory: RendererFactory;
  private router: Router;

  /**
   * Creates a new server instance
   * @param {ServerOptions} options - Server configuration options
   */
  constructor(options: ServerOptions = {}) {
    this.port = options.port || 8000;
    this.hostname = options.hostname || '0.0.0.0';
    this.router = new Router();
    this.rendererFactory = options.rendererFactory || new RendererFactory();
  }

  /**
   * Starts the server
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    const handler = async (request: Request): Promise<Response> => {
      try {
        const response = await this.router.handle(request);
        return response;
      } catch (error) {
        if (error instanceof ApiError) {
          return createResponse(error.toJSON(), { status: error.status });
        }
        return createResponse({
          error: {
            message: error instanceof Error ? error.message : 'Internal Server Error',
            status: 500,
            code: 'INTERNAL_ERROR'
          }
        }, { status: 500 });
      }
    };

    await serve(handler, {
      port: this.port,
      hostname: this.hostname
    });
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
    if (!this.server) {
      throw new Error('Server is not running');
    }

    this.server.abort();
    this.server = null;
    console.log('Server stopped');
  }
} 