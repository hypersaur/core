/**
 * Resource class for HATEOAS Resources
 * 
 * Represents an API resource with properties, links, and state transitions.
 * Follows the Single Responsibility Principle by focusing only on resource
 * representation, delegating link management to LinkManager.
 */

import { LinkManager, LinkObject, LinkOptions } from './link.ts';
import { ResourceState } from './state.ts';
import { InvalidArgumentError } from './errors.ts';

export interface ResourceOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
}

export interface StateTransition {
  from: string;
  to: string;
  name: string;
  href: string;
  method?: string;
  conditions?: Record<string, unknown>;
}

export class Resource {
  private type = '';
  private id = '';
  private properties: Record<string, unknown> = {};
  private linkManager: LinkManager;
  private stateManager: ResourceState;
  private embedded: Record<string, Resource[]> = {};

  /**
   * Create a new resource
   * @param options - Resource options
   */
  constructor(options: ResourceOptions = {}) {
    this.linkManager = new LinkManager();
    this.stateManager = new ResourceState();
    
    if (options.type) this.setType(options.type);
    if (options.id) this.setId(options.id);
    if (options.properties) this.setProperties(options.properties);
  }

  /**
   * Set the resource type
   * @param type - Resource type
   * @returns The resource instance for chaining
   */
  setType(type: string): Resource {
    if (typeof type !== 'string') {
      throw new InvalidArgumentError('Resource type must be a string');
    }
    this.type = type;
    return this;
  }

  /**
   * Get the resource type
   * @returns The resource type
   */
  getType(): string {
    return this.type;
  }

  /**
   * Set the resource ID
   * @param id - Resource ID
   * @returns The resource instance for chaining
   */
  setId(id: string | number): Resource {
    if (typeof id !== 'string' && typeof id !== 'number') {
      throw new InvalidArgumentError('Resource ID must be a string or number');
    }
    this.id = String(id);
    return this;
  }

  /**
   * Get the resource ID
   * @returns The resource ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Set a resource property
   * @param key - Property name
   * @param value - Property value
   * @returns The resource instance for chaining
   */
  setProperty(key: string, value: unknown): Resource {
    if (typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a string');
    }
    this.properties[key] = value;
    return this;
  }

  /**
   * Set multiple properties at once
   * @param properties - Properties object
   * @returns The resource instance for chaining
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
   * Get a resource property
   * @param key - Property name
   * @returns The property value or undefined if not found
   */
  getProperty(key: string): unknown {
    return this.properties[key];
  }

  /**
   * Get all resource properties
   * @returns All properties
   */
  getProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  /**
   * Add a link to the resource
   * @param rel - Link relation
   * @param href - Link URI
   * @param method - HTTP method
   * @param options - Additional link options
   * @returns The resource instance for chaining
   */
  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, href, method, options);
    return this;
  }

  /**
   * Add a templated link (URI Template) to the resource
   * @param rel - Link relation
   * @param template - URI template
   * @param method - HTTP method
   * @param options - Additional link options
   * @returns The resource instance for chaining
   */
  addTemplatedLink(rel: string, template: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, template, method, { ...options, templated: true });
    return this;
  }

  /**
   * Get a link by relation
   * @param rel - Link relation
   * @returns The link, links array, or undefined if not found
   */
  getLink(rel: string): LinkObject | undefined {
    return this.linkManager.getLink(rel);
  }

  /**
   * Get the self link href
   * @returns The self link href or undefined if not found
   */
  getSelfLink(): string | undefined {
    const selfLink = this.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  /**
   * Get all links
   * @returns All links grouped by relation
   */
  getLinks(): Record<string, LinkObject> {
    return this.linkManager.getLinks();
  }

  /**
   * Check if a link relation exists
   * @param rel - Link relation
   * @returns True if the relation exists
   */
  hasLink(rel: string): boolean {
    return this.linkManager.hasLink(rel);
  }

  /**
   * Remove a link by relation
   * @param rel - Link relation
   * @returns The resource instance for chaining
   */
  removeLink(rel: string): Resource {
    this.linkManager.removeLink(rel);
    return this;
  }

  /**
   * Embed a related resource
   * @param rel - Relation to the parent resource
   * @param resource - Resource(s) to embed
   * @returns The resource instance for chaining
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
   * Get embedded resources
   * @param rel - Optional relation to retrieve specific embedded resources
   * @returns Embedded resources
   */
  getEmbedded(rel?: string): Record<string, Resource[]> | Resource[] | undefined {
    if (rel) {
      return this.embedded[rel];
    }
    
    return { ...this.embedded };
  }

  /**
   * Check if the resource has embedded resources with a relation
   * @param rel - Relation to check
   * @returns True if the resource has embedded resources with the relation
   */
  hasEmbedded(rel: string): boolean {
    return !!this.embedded[rel] && this.embedded[rel].length > 0;
  }

  /**
   * Set the resource state
   * @param state - The new state
   * @returns The resource instance for chaining
   */
  setState(state: string): Resource {
    this.stateManager.setState(state);
    return this;
  }

  /**
   * Get the current resource state
   * @returns The current state
   */
  getState(): string {
    return this.stateManager.getState();
  }

  /**
   * Add a state transition
   * @param from - Starting state
   * @param to - Target state
   * @param name - Transition name
   * @param href - Transition URI
   * @param method - HTTP method
   * @param conditions - Transition conditions
   * @returns The resource instance for chaining
   */
  addStateTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): Resource {
    this.stateManager.addTransition(from, to, name, href, method, conditions);
    return this;
  }

  /**
   * Get available state transitions
   * @returns Available transitions
   */
  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.getState(), this.getProperties());
  }

  /**
   * Apply a state transition
   * @param transitionName - Name of the transition to apply
   * @returns The resource instance for chaining
   */
  applyTransition(transitionName: string): Resource {
    const newState = this.stateManager.applyTransition(this.getState(), transitionName, this.getProperties());
    this.setState(newState);
    return this;
  }

  /**
   * Create a deep copy of the resource
   * @returns A new resource instance
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
   * Convert the resource to a JSON object
   * @returns JSON representation of the resource
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