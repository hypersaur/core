/**
 * Event system interfaces and implementation
 */

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Framework event names
 */
export enum FrameworkEvent {
  REQUEST_START = 'request:start',
  REQUEST_END = 'request:end',
  RESOURCE_CREATED = 'resource:created',
  RESOURCE_UPDATED = 'resource:updated',
  RESOURCE_DELETED = 'resource:deleted',
  ERROR = 'error',
  SERVER_START = 'server:start',
  SERVER_STOP = 'server:stop',
}

/**
 * Event emitter class for framework events
 */
export class EventEmitter {
  private events: Record<string, EventHandler[]> = {};
  
  /**
   * Register an event handler
   */
  on<T = any>(event: string, handler: EventHandler<T>): EventEmitter {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler as EventHandler);
    return this;
  }
  
  /**
   * Remove an event handler
   */
  off<T = any>(event: string, handler: EventHandler<T>): EventEmitter {
    if (!this.events[event]) {
      return this;
    }
    
    this.events[event] = this.events[event].filter(h => h !== handler);
    return this;
  }
  
  /**
   * Emit an event
   */
  emit<T = any>(event: string, data: T): EventEmitter {
    const handlers = this.events[event] || [];
    handlers.forEach(handler => handler(data));
    return this;
  }
  
  /**
   * Remove all event handlers
   */
  removeAllListeners(event?: string): EventEmitter {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
  
  /**
   * Get all registered events
   */
  getEventNames(): string[] {
    return Object.keys(this.events);
  }
  
  /**
   * Get handlers for an event
   */
  getHandlers(event: string): EventHandler[] {
    return [...(this.events[event] || [])];
  }
  
  /**
   * Register a one-time event handler
   */
  once<T = any>(event: string, handler: EventHandler<T>): EventEmitter {
    const onceHandler: EventHandler = (data) => {
      this.off(event, onceHandler);
      (handler as EventHandler)(data);
    };
    
    return this.on(event, onceHandler);
  }
} 