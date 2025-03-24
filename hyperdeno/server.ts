/**
 * Deno server implementation for HyperDeno
 * 
 * This file contains the Deno-specific server implementation, keeping it separate
 * from the core framework code to allow for different server implementations.
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createApp, Resource, Collection } from './index.ts';
import { Router } from './http/router.ts';
import { JsonRenderer } from './rendering/json-renderer.ts';
import { HtmlRenderer } from './rendering/html-renderer.ts';
import { ContentNegotiator } from './rendering/negotiation.ts';

export interface ServerOptions {
  port?: number;
  hostname?: string;
  renderers?: Array<JsonRenderer | HtmlRenderer>;
}

export class Server {
  private app = createApp();
  private port: number;
  private hostname: string;
  private server: AbortController | null = null;

  constructor(options: ServerOptions = {}) {
    this.port = options.port || 8000;
    this.hostname = options.hostname || 'localhost';
    
    // Add default renderers if none provided
    if (!options.renderers) {
      const jsonRenderer = new JsonRenderer();
      const htmlRenderer = new HtmlRenderer();
      const negotiator = new ContentNegotiator();
      negotiator.addRenderers([jsonRenderer, htmlRenderer]);
      this.app.setContentNegotiator(negotiator);
    } else {
      const negotiator = new ContentNegotiator();
      negotiator.addRenderers(options.renderers);
      this.app.setContentNegotiator(negotiator);
    }
  }

  /**
   * Get the router instance
   */
  getRouter(): Router {
    return this.app.getRouter();
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    const handler = async (request: Request): Promise<Response> => {
      try {
        return await this.app.handle(request);
      } catch (error) {
        console.error('Error handling request:', error);
        return new Response(
          JSON.stringify({ error: 'Internal Server Error' }),
          { status: 500, headers: { 'content-type': 'application/json' } }
        );
      }
    };

    this.server = new AbortController();
    await serve(handler, {
      port: this.port,
      hostname: this.hostname,
      signal: this.server.signal
    });

    console.log(`Server running at http://${this.hostname}:${this.port}/`);
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