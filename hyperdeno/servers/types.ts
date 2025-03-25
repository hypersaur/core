/**
 * Base interface for HTTP servers in HyperDeno
 */

export interface ServerOptions {
  port?: number;
  hostname?: string;
  cert?: string;
  key?: string;
}

export interface Server {
  /**
   * Start the server
   * @param options Server configuration options
   */
  start(options?: ServerOptions): Promise<void>;

  /**
   * Stop the server
   */
  stop(): Promise<void>;

  /**
   * Get the server's current status
   */
  getStatus(): 'running' | 'stopped';
} 