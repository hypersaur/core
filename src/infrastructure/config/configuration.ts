/**
 * Framework configuration interfaces and manager
 */

import { Plugin } from '../../application/plugins/plugin-interface.ts';
import { MiddlewareFunction } from '../http/middleware.ts';
import { ResourceRenderer } from '../http/renderer.ts';
import { EventHandler } from '../../application/events/event-emitter.ts';

/**
 * Framework configuration interface
 */
export interface FrameworkConfig {
  port?: number;
  hostname?: string;
  plugins?: Plugin[];
  middlewares?: MiddlewareFunction[];
  renderers?: ResourceRenderer[];
  defaultMediaType?: string;
  eventHandlers?: Record<string, EventHandler[]>;
  errorHandling?: {
    detailed?: boolean;
    handlers?: Record<string, (error: Error) => Response>;
  };
}

/**
 * Configuration manager class
 */
export class ConfigurationManager {
  private config: FrameworkConfig;
  
  constructor(initialConfig: FrameworkConfig = {}) {
    // Set default configuration
    this.config = {
      port: 3000,
      hostname: '0.0.0.0',
      plugins: [],
      middlewares: [],
      renderers: [],
      defaultMediaType: 'application/json',
      eventHandlers: {},
      errorHandling: {
        detailed: false,
        handlers: {}
      },
      ...initialConfig
    };
  }
  
  /**
   * Get the current configuration
   */
  getConfig(): FrameworkConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FrameworkConfig>): ConfigurationManager {
    this.config = {
      ...this.config,
      ...newConfig,
      errorHandling: {
        ...this.config.errorHandling,
        ...(newConfig.errorHandling || {})
      }
    };
    return this;
  }
  
  /**
   * Get a specific configuration value
   */
  get<K extends keyof FrameworkConfig>(key: K): FrameworkConfig[K] {
    return this.config[key];
  }
  
  /**
   * Set a specific configuration value
   */
  set<K extends keyof FrameworkConfig>(key: K, value: FrameworkConfig[K]): ConfigurationManager {
    this.config[key] = value;
    return this;
  }
} 