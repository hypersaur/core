import type { Server, ServerOptions } from './types.ts';

/**
 * Deno-specific HTTP server implementation
 */
export class DenoServer implements Server {
  private status: 'running' | 'stopped' = 'stopped';
  private server: ReturnType<typeof Deno.serve> | null = null;
  private handler: (req: Request) => Response | Promise<Response>;

  constructor(handler: (req: Request) => Response | Promise<Response>) {
    this.handler = handler;
  }

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

    this.server = Deno.serve(serverOptions, this.handler);
    this.status = 'running';
  }

  async stop(): Promise<void> {
    if (this.status === 'stopped') {
      throw new Error('Server is not running');
    }

    if (this.server) {
      this.server.shutdown();
      this.server = null;
      this.status = 'stopped';
    }
  }

  getStatus(): 'running' | 'stopped' {
    return this.status;
  }
} 