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
import { ResourceState } from './state.ts';
import { InvalidArgumentError } from './errors.ts';

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
 * Represents a state transition in the resource's state machine
 * @interface StateTransition
 * @property {string} from - The source state
 * @property {string} to - The target state
 * @property {string} name - The name of the transition
 * @property {string} href - The URI for the transition
 * @property {string} [method] - The HTTP method for the transition (defaults to 'POST')
 * @property {Record<string, unknown>} [conditions] - Conditions that must be met for the transition
 */
export interface StateTransition {
  from: string;
  to: string;
  name: string;
  href: string;
  method?: string;
  conditions?: Record<string, unknown>;
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
   * @param {ResourceOptions} options - Configuration options for the resource
   */
  constructor(options: ResourceOptions = {}) {
    this.linkManager = new LinkManager();
    this.stateManager = new ResourceState();
    
    if (options.type) this.setType(options.type);
    if (options.id) this.setId(options.id);
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
   * Sets a single property on the resource
   * @param {string} key - The property name
   * @param {unknown} value - The property value
   * @throws {InvalidArgumentError} If key is not a string
   * @returns {Resource} The resource instance for method chaining
   */
  setProperty(key: string, value: unknown): Resource {
    if (typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a string');
    }
    this.properties[key] = value;
    return this;
  }

  /**
   * Sets multiple properties on the resource at once
   * @param {Record<string, unknown>} properties - Object containing properties to set
   * @throws {InvalidArgumentError} If properties is not an object
   * @returns {Resource} The resource instance for method chaining
   */
  setProperties(properties: Record<string, unknown>): Resource {
    if (typeof properties !== 'object' || properties === null) {
      throw new InvalidArgumentError('Properties must be an object');
    }
    
    for (const [key, value] of Object.entries(properties)) {
      this.setProperty(key, value);
    }
    
    return this;
  }

  /**
   * Gets a property value by key
   * @param {string} key - The property name
   * @returns {unknown} The property value or undefined if not found
   */
  getProperty(key: string): unknown {
    return this.properties[key];
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
   * Adds a state transition to the resource
   * @param {string} from - The source state
   * @param {string} to - The target state
   * @param {string} name - The transition name
   * @param {string} href - The transition URI
   * @param {string} [method='POST'] - The HTTP method for the transition
   * @param {Record<string, unknown>} [conditions] - Conditions for the transition
   * @returns {Resource} The resource instance for method chaining
   */
  addStateTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): Resource {
    this.stateManager.addTransition(from, to, name, href, method, conditions);
    return this;
  }

  /**
   * Gets all available state transitions
   * @returns {StateTransition[]} Array of available transitions
   */
  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.getState(), this.getProperties());
  }

  /**
   * Applies a state transition by name
   * @param {string} transitionName - The name of the transition to apply
   * @returns {Resource} The resource instance for method chaining
   */
  applyTransition(transitionName: string): Resource {
    const newState = this.stateManager.applyTransition(this.getState(), transitionName, this.getProperties());
    this.setState(newState);
    return this;
  }

  /**
   * Creates a deep copy of the resource
   * @returns {Resource} A new resource instance with the same data
   */
  clone(): Resource {
    const clone = new Resource({
      type: this.type,
      id: this.id,
      properties: { ...this.properties }
    });

    // Clone links
    const links = this.getLinks();
    for (const [rel, link] of Object.entries(links)) {
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
    }

    // Clone embedded resources
    const embedded = this.getEmbedded();
    if (embedded) {
      for (const [rel, resources] of Object.entries(embedded)) {
        clone.embed(rel, resources.map((r: Resource) => r.clone()));
      }
    }

    // Clone state transitions
    const transitions = this.getAvailableTransitions();
    transitions.forEach(t => {
      clone.addStateTransition(t.from, t.to, t.name, t.href, t.method, t.conditions);
    });

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
} 