/**
 * Resource class for HATEOAS Resources
 * 
 * Represents an API resource with properties, links, and state transitions.
 * Follows the Single Responsibility Principle by focusing only on resource
 * representation, delegating link management to LinkManager.
 * 
 * @example
 * ```typescript
 * const resource = new Resource({
 *   type: 'user',
 *   id: '123',
 *   properties: { name: 'John Doe' }
 * });
 * 
 * resource.addLink('self', '/users/123');
 * resource.addLink('edit', '/users/123/edit', 'PUT');
 * ```
 */

import { LinkManager, LinkObject, LinkOptions } from './link.ts';
import { ResourceState, StateTransition } from './state.ts';
import { InvalidArgumentError, StateTransitionError } from './errors.ts';

/**
 * Options for creating a new Resource instance
 * @interface ResourceOptions
 * @property {string} [type] - The type of the resource (e.g., 'user', 'post')
 * @property {string} [id] - The unique identifier of the resource
 * @property {Record<string, unknown>} [properties] - The resource's properties
 */
export interface ResourceOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
}

/**
 * Main Resource class implementing HATEOAS principles
 * @class Resource
 */
export class Resource {
  private type = '';
  private id = '';
  private properties: Record<string, unknown> = {};
  private linkManager: LinkManager;
  private stateManager: ResourceState;
  private embedded: Record<string, Resource[]> = {};

  /**
   * Creates a new Resource instance
   * @param {string} [type] - The type of the resource
   * @param {string} [id] - The unique identifier of the resource
   * @param {ResourceOptions} [options] - Additional configuration options
   */
  constructor(type?: string, id?: string, options: ResourceOptions = {}) {
    this.linkManager = new LinkManager();
    this.stateManager = new ResourceState();
    
    if (type) this.setType(type);
    if (id) this.setId(id);
    if (options.properties) this.setProperties(options.properties);
  }

  /**
   * Sets the type of the resource
   * @param {string} type - The resource type
   * @throws {InvalidArgumentError} If type is not a string
   * @returns {Resource} The resource instance for method chaining
   */
  setType(type: string): Resource {
    if (typeof type !== 'string') {
      throw new InvalidArgumentError('Resource type must be a string');
    }
    this.type = type;
    return this;
  }

  /**
   * Gets the type of the resource
   * @returns {string} The resource type
   */
  getType(): string {
    return this.type;
  }

  /**
   * Sets the unique identifier of the resource
   * @param {string|number} id - The resource ID
   * @throws {InvalidArgumentError} If id is not a string or number
   * @returns {Resource} The resource instance for method chaining
   */
  setId(id: string | number): Resource {
    if (typeof id !== 'string' && typeof id !== 'number') {
      throw new InvalidArgumentError('Resource ID must be a string or number');
    }
    this.id = String(id);
    return this;
  }

  /**
   * Gets the unique identifier of the resource
   * @returns {string} The resource ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Set a property on the resource
   * @param key - Property key
   * @param value - Property value
   * @throws {InvalidArgumentError} If the property key is invalid
   */
  setProperty(key: string, value: unknown): void {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a string');
    }
    this.properties[key] = value;
  }

  /**
   * Gets a property from the resource
   * @param {string} key - The property key
   * @returns {unknown} The property value
   */
  getProperty(key: string): unknown {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a non-empty string');
    }

    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let current: Record<string, unknown> = this.properties;
      
      for (const part of parts) {
        if (!(part in current)) {
          return undefined;
        }
        current = current[part] as Record<string, unknown>;
      }
      
      return current;
    }
    
    return this.properties[key];
  }

  /**
   * Sets multiple properties on the resource
   * @param {Record<string, unknown>} properties - The properties to set
   * @throws {InvalidArgumentError} If properties is not an object
   * @returns {Resource} The resource instance for method chaining
   */
  setProperties(properties: Record<string, unknown>): Resource {
    if (!properties || typeof properties !== 'object') {
      throw new InvalidArgumentError('Properties must be an object');
    }
    
    Object.entries(properties).forEach(([key, value]) => {
      this.setProperty(key, value);
    });
    
    return this;
  }

  /**
   * Gets all properties of the resource
   * @returns {Record<string, unknown>} A copy of all properties
   */
  getProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  /**
   * Adds a link to the resource
   * @param {string} rel - The link relation (e.g., 'self', 'edit')
   * @param {string} href - The link URI
   * @param {string} [method='GET'] - The HTTP method for the link
   * @param {LinkOptions} [options] - Additional link options
   * @returns {Resource} The resource instance for method chaining
   */
  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, href, method, options);
    return this;
  }

  /**
   * Adds a templated link (URI Template) to the resource
   * @param {string} rel - The link relation
   * @param {string} template - The URI template
   * @param {string} [method='GET'] - The HTTP method for the link
   * @param {LinkOptions} [options] - Additional link options
   * @returns {Resource} The resource instance for method chaining
   */
  addTemplatedLink(rel: string, template: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, template, method, { ...options, templated: true });
    return this;
  }

  /**
   * Gets a link by its relation
   * @param {string} rel - The link relation
   * @returns {LinkObject|undefined} The link object or undefined if not found
   */
  getLink(rel: string): LinkObject | undefined {
    return this.linkManager.getLink(rel);
  }

  /**
   * Gets the self link URI
   * @returns {string|undefined} The self link URI or undefined if not found
   */
  getSelfLink(): string | undefined {
    const selfLink = this.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  /**
   * Gets all links associated with the resource
   * @returns {Record<string, LinkObject>} All links grouped by relation
   */
  getLinks(): Record<string, LinkObject> {
    return this.linkManager.getLinks();
  }

  /**
   * Checks if a link relation exists
   * @param {string} rel - The link relation to check
   * @returns {boolean} True if the relation exists
   */
  hasLink(rel: string): boolean {
    return this.linkManager.hasLink(rel);
  }

  /**
   * Removes a link by its relation
   * @param {string} rel - The link relation to remove
   * @returns {Resource} The resource instance for method chaining
   */
  removeLink(rel: string): Resource {
    this.linkManager.removeLink(rel);
    return this;
  }

  /**
   * Embeds a related resource or array of resources
   * @param {string} rel - The relation to the parent resource
   * @param {Resource|Resource[]} resource - The resource(s) to embed
   * @returns {Resource} The resource instance for method chaining
   */
  embed(rel: string, resource: Resource | Resource[]): Resource {
    if (!this.embedded[rel]) {
      this.embedded[rel] = [];
    }
    
    if (Array.isArray(resource)) {
      this.embedded[rel] = [...this.embedded[rel], ...resource];
    } else {
      this.embedded[rel].push(resource);
    }
    
    return this;
  }

  /**
   * Gets embedded resources
   * @param {string} [rel] - Optional relation to retrieve specific embedded resources
   * @returns {Record<string, Resource[]>|Resource[]|undefined} The embedded resources
   */
  getEmbedded(rel?: string): Record<string, Resource[]> | Resource[] | undefined {
    if (rel) {
      return this.embedded[rel];
    }
    
    return { ...this.embedded };
  }

  /**
   * Checks if the resource has embedded resources with a specific relation
   * @param {string} rel - The relation to check
   * @returns {boolean} True if embedded resources exist with the relation
   */
  hasEmbedded(rel: string): boolean {
    return !!this.embedded[rel] && this.embedded[rel].length > 0;
  }

  /**
   * Sets the current state of the resource
   * @param {string} state - The new state
   * @returns {Resource} The resource instance for method chaining
   */
  setState(state: string): Resource {
    this.stateManager.setState(state);
    return this;
  }

  /**
   * Gets the current state of the resource
   * @returns {string} The current state
   */
  getState(): string {
    return this.stateManager.getState();
  }

  /**
   * Add a state transition
   * @param from - Current state
   * @param to - Target state
   * @param name - Transition name
   * @param href - Transition URI
   * @param method - HTTP method for the transition
   * @param conditions - Optional conditions for the transition
   * @throws {InvalidArgumentError} If the states are invalid
   */
  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): void {
    if (!from || !to) {
      throw new InvalidArgumentError('State names must be non-empty strings');
    }
    this.stateManager.addTransition(from, to, name, href, method, conditions);
  }

  /**
   * Apply a state transition
   * @param transitionName - Name of the transition to apply
   * @throws {StateTransitionError} If the transition is invalid
   */
  applyTransition(transitionName: string): void {
    try {
      this.stateManager.setState(this.stateManager.applyTransition(this.getState(), transitionName, this.getProperties()));
    } catch (error) {
      if (error instanceof StateTransitionError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new StateTransitionError(`Failed to apply transition "${transitionName}": ${error.message}`);
      }
      throw new StateTransitionError(`Failed to apply transition "${transitionName}"`);
    }
  }

  /**
   * Creates a deep copy of the resource
   * @returns {Resource} A new resource instance with the same data
   */
  clone(): Resource {
    const json = this.toJSON();
    const { _type, _id, _links, _embedded, _state, ...properties } = json;
    const clone = new Resource(
      typeof _type === 'string' ? _type : undefined,
      typeof _id === 'string' ? _id : undefined,
      { properties: properties as Record<string, unknown> }
    );
    
    // Restore links
    if (_links) {
      Object.entries(_links).forEach(([rel, link]) => {
        if (Array.isArray(link)) {
          link.forEach(l => clone.addLink(rel, l.href, l.method, {
            templated: l.templated,
            title: l.title,
            type: l.type,
            hreflang: l.hreflang,
            attrs: l.attrs
          }));
        } else {
          clone.addLink(rel, link.href, link.method, {
            templated: link.templated,
            title: link.title,
            type: link.type,
            hreflang: link.hreflang,
            attrs: link.attrs
          });
        }
      });
    }

    // Restore embedded resources
    if (_embedded) {
      Object.entries(_embedded).forEach(([rel, resources]) => {
        if (Array.isArray(resources)) {
          clone.embed(rel, resources.map(r => new Resource(
            typeof r._type === 'string' ? r._type : undefined,
            typeof r._id === 'string' ? r._id : undefined,
            { properties: r as Record<string, unknown> }
          )));
        }
      });
    }

    // Restore state
    if (typeof _state === 'string') {
      clone.setState(_state);
    }

    return clone;
  }

  /**
   * Converts the resource to a JSON object
   * @returns {Record<string, unknown>} The resource as a JSON object
   */
  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      ...this.properties,
      _links: this.getLinks()
    };

    if (this.type) {
      json._type = this.type;
    }

    if (this.id) {
      json._id = this.id;
    }

    const embedded = this.getEmbedded();
    if (embedded && Object.keys(embedded).length > 0) {
      json._embedded = embedded;
    }

    const state = this.getState();
    if (state) {
      json._state = state;
    }

    return json;
  }

  /**
   * Gets all available transitions for the current state
   * @returns {StateTransition[]} Array of available transitions
   */
  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.getState(), this.getProperties());
  }
} 