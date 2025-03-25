/**
 * 🎯 Resource class for HATEOAS Resources
 * 
 * This is the core class implementing HATEOAS (Hypertext As The Engine Of Application State) principles.
 * It represents an API resource with properties, links, and state transitions, enabling clients to
 * navigate through the API by following hyperlinks and understanding resource relationships.
 * 
 * Key HATEOAS principles implemented:
 * - Self-descriptive messages: Resources include metadata about their state and available actions
 * - Hypermedia-driven: All state transitions are represented as links
 * - Stateless: Each request contains all necessary information
 * - Client-server: Clear separation between client and server concerns
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

import { LinkManager, type LinkObject, type LinkOptions } from './link.ts';
import { ResourceState, type StateTransition } from './state.ts';
import { InvalidArgumentError, StateTransitionError } from './errors.ts';

/**
 * 🔧 Options for creating a new Resource instance
 * 
 * These options define the initial state of a HATEOAS resource, including its
 * type, identifier, and properties. The type and id are crucial for resource
 * identification and relationship management in the API.
 * 
 * @interface ResourceOptions
 * @property {string} [type] - The type of the resource (e.g., 'user', 'post')
 * @property {string} [id] - The unique identifier of the resource
 * @property {Record<string, unknown>} [properties] - The resource's properties
 * @property {string} [initialState] - The initial state of the resource
 */
export interface ResourceOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  initialState?: string;
}

/**
 * 🏗️ Main Resource class implementing HATEOAS principles
 * 
 * This class serves as the foundation for building HATEOAS-compliant APIs by:
 * - Managing resource state and properties
 * - Handling hypermedia controls (links)
 * - Supporting state transitions
 * - Managing embedded resources
 * 
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
   * 🎨 Creates a new Resource instance
   * 
   * Initializes a new HATEOAS resource with the provided options. The resource
   * starts in an empty state and can be enriched with properties, links, and
   * embedded resources as needed.
   * 
   * @param {ResourceOptions} [options] - Additional configuration options
   */
  constructor(options: ResourceOptions = {}) {
    this.type = options.type || '';
    this.id = options.id || '';
    this.properties = options.properties || {};
    this.linkManager = new LinkManager();
    this.stateManager = new ResourceState(options.initialState || 'draft');
  }

  /**
   * 📝 Set a property on the resource
   * 
   * Properties represent the resource's state in HATEOAS. This method supports
   * both flat and nested properties, allowing for complex resource representations
   * while maintaining a clean API.
   * 
   * @param key - Property key
   * @param value - Property value
   * @throws {InvalidArgumentError} If the property key is invalid
   */
  setProperty(key: string, value: unknown): void {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a string');
    }

    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.properties;
      const lastPart = parts.pop()!;

      for (const part of parts) {
        if (!(part in current)) {
          current[part] = {};
        }
        if (typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      
      current[lastPart] = value;
      return;
    }

    this.properties[key] = value;
  }

  /**
   * 📖 Gets a property from the resource
   * 
   * Retrieves a property value from the resource, supporting both flat and
   * nested property access. This is essential for clients to understand the
   * resource's current state.
   * 
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
      let current = this.properties;

      for (const part of parts) {
        if (!(part in current) || typeof current[part] !== 'object') {
          return undefined;
        }
        current = current[part] as Record<string, unknown>;
      }

      return current;
    }

    return this.properties[key];
  }

  /**
   * 🔗 Adds a link to the resource
   * 
   * Links are fundamental to HATEOAS as they enable clients to discover
   * and navigate through the API. This method adds a link with the specified
   * relation and URL.
   * 
   * @param {string} rel - The link relation
   * @param {string} href - The link URL
   * @param {string} [method='GET'] - The HTTP method for the link
   * @param {LinkOptions} [options] - Additional link options
   * @returns {Resource} The resource instance for method chaining
   */
  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, href, method, options);
    return this;
  }

  /**
   * 🔗 Adds a templated link to the resource
   * 
   * Templated links are useful for links that require parameters, such as
   * search or filter operations. The template can be expanded with actual
   * values when needed.
   * 
   * @param {string} rel - The link relation
   * @param {string} template - The link template
   * @param {string} [method='GET'] - The HTTP method for the link
   * @param {LinkOptions} [options] - Additional link options
   * @returns {Resource} The resource instance for method chaining
   */
  addTemplatedLink(rel: string, template: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, template, method, { ...options, templated: true });
    return this;
  }

  /**
   * 🔗 Gets a link by its relation
   * 
   * Retrieves a specific link from the resource by its relation name.
   * This is essential for clients to find specific navigation options.
   * 
   * @param {string} rel - The link relation
   * @returns {LinkObject | undefined} The link object or undefined if not found
   */
  getLink(rel: string): LinkObject | undefined {
    return this.linkManager.getLink(rel);
  }

  /**
   * 🔗 Gets the self link of the resource
   * 
   * The self link is a crucial part of HATEOAS as it uniquely identifies
   * the resource and enables clients to reference it.
   * 
   * @returns {string | undefined} The self link URL or undefined if not set
   */
  getSelfLink(): string | undefined {
    const selfLink = this.linkManager.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  /**
   * 🔗 Gets all links from the resource
   * 
   * Returns all links associated with the resource, enabling clients to
   * discover all available navigation options.
   * 
   * @returns {Record<string, LinkObject>} Map of link relations to link objects
   */
  getLinks(): Record<string, LinkObject> {
    return this.linkManager.getLinks();
  }

  /**
   * 🔗 Checks if a link exists
   * 
   * Verifies whether a specific link relation exists on the resource.
   * 
   * @param {string} rel - The link relation to check
   * @returns {boolean} Whether the link exists
   */
  hasLink(rel: string): boolean {
    return this.linkManager.hasLink(rel);
  }

  /**
   * 🔗 Removes a link from the resource
   * 
   * Removes a specific link by its relation name, which is useful when
   * updating resource state or removing navigation options.
   * 
   * @param {string} rel - The link relation to remove
   * @returns {Resource} The resource instance for method chaining
   */
  removeLink(rel: string): Resource {
    this.linkManager.removeLink(rel);
    return this;
  }

  /**
   * 📦 Embeds a resource or array of resources
   * 
   * Embedded resources are a key feature of HATEOAS, allowing related
   * resources to be included directly in the response.
   * 
   * @param {string} rel - The relation name for the embedded resources
   * @param {Resource | Resource[]} resource - The resource(s) to embed
   * @returns {Resource} The resource instance for method chaining
   */
  embed(rel: string, resource: Resource | Resource[]): Resource {
    if (!rel || typeof rel !== 'string') {
      throw new InvalidArgumentError('Relation must be a non-empty string');
    }

    if (Array.isArray(resource)) {
      this.embedded[rel] = resource;
    } else {
      this.embedded[rel] = [resource];
    }

    return this;
  }

  /**
   * 📦 Gets embedded resources
   * 
   * Retrieves embedded resources by their relation name or all embedded
   * resources if no relation is specified.
   * 
   * @param {string} [rel] - Optional relation name to filter by
   * @returns {Record<string, Resource[]> | Resource[] | undefined} The embedded resources
   */
  getEmbedded(rel?: string): Record<string, Resource[]> | Resource[] | undefined {
    if (rel) {
      return this.embedded[rel];
    }
    return this.embedded;
  }

  /**
   * 📦 Checks if embedded resources exist
   * 
   * Verifies whether embedded resources exist for a specific relation.
   * 
   * @param {string} rel - The relation to check
   * @returns {boolean} Whether embedded resources exist
   */
  hasEmbedded(rel: string): boolean {
    return rel in this.embedded;
  }

  /**
   * 🔄 Adds a state transition
   * 
   * Defines a new possible state transition, including its conditions and
   * the hypermedia controls needed to trigger it.
   * 
   * @param {string} from - The source state
   * @param {string} to - The target state
   * @param {string} name - The transition name
   * @param {string} href - The URI for the transition
   * @param {string} [method='POST'] - The HTTP method for the transition
   * @param {Record<string, unknown>} [conditions] - Conditions for the transition
   */
  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): void {
    this.stateManager.addTransition(from, to, name, href, method, conditions);
    this.addLink(name, href, method);
  }

  /**
   * 🔄 Applies a state transition
   * 
   * Changes the resource's state using the specified transition name.
   * This is how clients can trigger state changes in the resource.
   * 
   * @param {string} name - The name of the transition to apply
   * @throws {StateTransitionError} If the transition is not available
   * @returns {Resource} The resource instance for method chaining
   */
  applyTransition(name: string): Resource {
    const currentState = this.stateManager.getState();
    const newState = this.stateManager.applyTransition(name, currentState, this.properties);
    this.stateManager.setState(newState);
    return this;
  }

  /**
   * 📚 Gets available state transitions
   * 
   * Returns all possible state transitions from the current state,
   * taking into account any conditions that must be met.
   * 
   * @returns {StateTransition[]} Available transitions
   */
  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.stateManager.getState(), this.properties);
  }

  /**
   * 📦 Converts the resource to a JSON representation
   * 
   * @returns {Record<string, unknown>} JSON representation of the resource
   */
  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      type: this.type,
      id: this.id,
      properties: this.properties,
      links: this.linkManager.getLinks(),
      state: this.stateManager.getState()
    };

    if (Object.keys(this.embedded).length > 0) {
      json.embedded = Object.fromEntries(
        Object.entries(this.embedded).map(([rel, resources]) => [
          rel,
          resources.map(resource => resource.toJSON())
        ])
      );
    }

    return json;
  }
} 