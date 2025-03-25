/**
 * 🚀 Deno HTTP Server Implementation for HATEOAS
 * 
 * This module provides a Deno-specific implementation of the HTTP server
 * interface, designed to handle HATEOAS requests and responses. It leverages
 * Deno's built-in HTTP server capabilities while maintaining HATEOAS principles.
 * 
 * Key features:
 * - Secure HTTPS support
 * - Graceful startup/shutdown
 * - HATEOAS request handling
 * - Resource state management
 * 
 * @example
 * ```typescript
 * const server = new DenoServer(handler);
 * await server.start({ port: 8000 });
 * ```
 */

import type { Server, ServerOptions } from './types.ts';

/**
 * 🎯 Deno-specific HTTP server implementation
 * 
 * This class implements the Server interface for Deno, providing
 * a robust HTTP server that can handle HATEOAS requests and maintain
 * proper resource state transitions.
 * 
 * @class DenoServer
 * @implements {Server}
 */
export class DenoServer implements Server {
  private status: 'running' | 'stopped' = 'stopped';
  private server: ReturnType<typeof Deno.serve> | null = null;
  private handler: (req: Request) => Response | Promise<Response>;

  /**
   * 🏗️ Creates a new Deno server instance
   * 
   * Initializes a new server with a request handler that processes
   * HATEOAS requests and returns appropriate responses.
   * 
   * @param {Function} handler - Request handler function
   */
  constructor(handler: (req: Request) => Response | Promise<Response>) {
    this.handler = handler;
  }

  /**
   * 🚀 Starts the HTTP server
   * 
   * Initializes and starts the Deno HTTP server with the specified
   * options. Supports both HTTP and HTTPS configurations.
   * 
   * @param {ServerOptions} [options] - Server configuration options
   * @throws {Error} If server is already running
   */
  async start(options: ServerOptions = {}): Promise<void> {
    if (this.status === 'running') {
      throw new Error('Server is already running');
    }

    const serverOptions = {
      port: options.port || 8000,
      hostname: options.hostname || '0.0.0.0',
      ...(options.cert && options.key ? {
        cert: options.cert,
        key: options.key,
      } : {}),
    };

    this.server = await Deno.serve(serverOptions, this.handler);
    this.status = 'running';
  }

  /**
   * 🛑 Stops the HTTP server
   * 
   * Gracefully shuts down the server, ensuring all connections
   * are properly closed and resources are released.
   * 
   * @throws {Error} If server is not running
   */
  async stop(): Promise<void> {
    if (this.status === 'stopped') {
      throw new Error('Server is not running');
    }

    if (this.server) {
      await this.server.shutdown();
      this.server = null;
      this.status = 'stopped';
    }
  }

  /**
   * 📊 Gets the current server status
   * 
   * Returns the current operational status of the server,
   * which is essential for monitoring and management.
   * 
   * @returns {'running' | 'stopped'} The server status
   */
  getStatus(): 'running' | 'stopped' {
    return this.status;
  }
} 