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
import { InvalidArgumentError } from './errors.ts';

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
 */
export interface ResourceOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
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
    this.stateManager = new ResourceState();
  }

  /**
   * 🏷️ Sets the type of the resource
   * 
   * The resource type is crucial in HATEOAS as it helps clients understand
   * the nature of the resource and its relationships with other resources.
   * 
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
   * 📋 Gets the type of the resource
   * 
   * Returns the resource type, which is essential for client-side processing
   * and understanding the resource's role in the API.
   * 
   * @returns {string} The resource type
   */
  getType(): string {
    return this.type;
  }

  /**
   * 🔑 Sets the unique identifier of the resource
   * 
   * The resource ID is fundamental in HATEOAS as it enables unique identification
   * and linking between resources. It's used in self-referential links and
   * resource relationships.
   * 
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
   * 🔑 Gets the unique identifier of the resource
   * 
   * Returns the resource's unique identifier, which is used in links and
   * resource relationships throughout the API.
   * 
   * @returns {string} The resource ID
   */
  getId(): string {
    return this.id;
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
   * 📦 Sets multiple properties on the resource
   * 
   * Allows bulk setting of properties, which is useful when initializing
   * resources or updating multiple properties at once.
   * 
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
   * 📚 Gets all properties of the resource
   * 
   * Returns a copy of all properties, ensuring encapsulation and preventing
   * unintended modifications to the resource's state.
   * 
   * @returns {Record<string, unknown>} A copy of all properties
   */
  getProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  /**
   * 🔗 Adds a link to the resource
   * 
   * Links are the core of HATEOAS, representing available actions and relationships.
   * This method adds a new link to the resource, enabling clients to discover
   * and navigate to related resources or perform actions.
   * 
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
   * 🔗 Adds a templated link to the resource
   * 
   * Templated links are a powerful HATEOAS feature that allows for dynamic
   * resource discovery and querying. This method adds a link with URI template
   * support.
   * 
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
   * 🔍 Gets a specific link from the resource
   * 
   * Retrieves a link by its relation type, which is essential for clients
   * to find specific actions or relationships they're interested in.
   * 
   * @param {string} rel - The link relation
   * @returns {LinkObject | undefined} The link object if found
   */
  getLink(rel: string): LinkObject | undefined {
    return this.linkManager.getLink(rel);
  }

  /**
   * 🏠 Gets the self-referential link of the resource
   * 
   * The self link is a fundamental concept in HATEOAS, providing the canonical
   * URI for the resource. It's essential for resource identification and caching.
   * 
   * @returns {string | undefined} The self link URI if present
   */
  getSelfLink(): string | undefined {
    const selfLink = this.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  /**
   * 📋 Gets all links from the resource
   * 
   * Returns all available links, enabling clients to discover all possible
   * actions and relationships associated with the resource.
   * 
   * @returns {Record<string, LinkObject>} All links indexed by relation
   */
  getLinks(): Record<string, LinkObject> {
    return this.linkManager.getLinks();
  }

  /**
   * 🔍 Checks if a specific link exists
   * 
   * Allows clients to check for the availability of specific actions or
   * relationships before attempting to use them.
   * 
   * @param {string} rel - The link relation to check
   * @returns {boolean} True if the link exists
   */
  hasLink(rel: string): boolean {
    return this.linkManager.hasLink(rel);
  }

  /**
   * ❌ Removes a link from the resource
   * 
   * Removes a link, which can be useful when a particular action or
   * relationship is no longer available for the resource.
   * 
   * @param {string} rel - The link relation to remove
   * @returns {Resource} The resource instance for method chaining
   */
  removeLink(rel: string): Resource {
    this.linkManager.removeLink(rel);
    return this;
  }

  /**
   * 📦 Embeds a related resource
   * 
   * Embedded resources are a key feature of HATEOAS that allows for efficient
   * representation of related resources without requiring additional requests.
   * This method adds a resource or array of resources as embedded content.
   * 
   * @param {string} rel - The relation type for the embedded resource
   * @param {Resource | Resource[]} resource - The resource(s) to embed
   * @returns {Resource} The resource instance for method chaining
   */
  embed(rel: string, resource: Resource | Resource[]): Resource {
    if (!this.embedded[rel]) {
      this.embedded[rel] = [];
    }
    
    if (Array.isArray(resource)) {
      this.embedded[rel].push(...resource);
    } else {
      this.embedded[rel].push(resource);
    }
    
    return this;
  }

  /**
   * 📚 Gets embedded resources
   * 
   * Retrieves embedded resources, which are crucial for efficient resource
   * representation and reducing the number of HTTP requests needed.
   * 
   * @param {string} [rel] - Optional relation type to filter embedded resources
   * @returns {Record<string, Resource[]> | Resource[] | undefined} The embedded resources
   */
  getEmbedded(rel?: string): Record<string, Resource[]> | Resource[] | undefined {
    if (rel) {
      return this.embedded[rel];
    }
    return this.embedded;
  }

  /**
   * 🔍 Checks if embedded resources exist
   * 
   * Allows clients to check for the presence of embedded resources before
   * attempting to access them.
   * 
   * @param {string} rel - The relation type to check
   * @returns {boolean} True if embedded resources exist
   */
  hasEmbedded(rel: string): boolean {
    return rel in this.embedded && this.embedded[rel].length > 0;
  }

  /**
   * 🔄 Sets the current state of the resource
   * 
   * State management is crucial in HATEOAS for representing the resource's
   * current condition and available transitions.
   * 
   * @param {string} state - The new state
   * @returns {Resource} The resource instance for method chaining
   */
  setState(state: string): Resource {
    this.stateManager.setState(state);
    return this;
  }

  /**
   * 📊 Gets the current state of the resource
   * 
   * Returns the resource's current state, which is essential for clients
   * to understand what actions are available.
   * 
   * @returns {string} The current state
   */
  getState(): string {
    return this.stateManager.getState();
  }

  /**
   * 🔄 Adds a state transition
   * 
   * State transitions are a key concept in HATEOAS, representing the possible
   * ways a resource can change state. This method defines a new transition
   * with its associated link and conditions.
   * 
   * @param {string} from - The source state
   * @param {string} to - The target state
   * @param {string} name - The transition name
   * @param {string} href - The transition URI
   * @param {string} [method='POST'] - The HTTP method for the transition
   * @param {Record<string, unknown>} [conditions] - Optional conditions for the transition
   */
  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): void {
    this.stateManager.addTransition(from, to, name, href, method, conditions);
  }

  /**
   * 🔄 Applies a state transition
   * 
   * Executes a state transition, updating the resource's state and ensuring
   * all associated links and conditions are properly handled.
   * 
   * @param {string} name - The transition name
   * @returns {Resource} The resource instance for method chaining
   */
  applyTransition(name: string): Resource {
    const currentState = this.getState();
    const newState = this.stateManager.applyTransition(name, currentState, this.getProperties());
    this.setState(newState);
    return this;
  }

  /**
   * 📋 Creates a deep copy of the resource
   * 
   * Useful for creating independent copies of resources, which is important
   * when dealing with resource templates or when modifications need to be
   * isolated from the original resource.
   * 
   * @returns {Resource} A new resource instance with the same state
   */
  clone(): Resource {
    const clone = new Resource({
      type: this.type,
      id: this.id,
      properties: { ...this.properties }
    });

    // Clone links
    Object.entries(this.getLinks()).forEach(([rel, link]) => {
      if (Array.isArray(link)) {
        link.forEach(l => clone.addLink(rel, l.href, l.method || 'GET', {
          templated: l.templated,
          title: l.title,
          type: l.type,
          hreflang: l.hreflang,
          attrs: l.attrs
        }));
      } else {
        clone.addLink(rel, link.href, link.method || 'GET', {
          templated: link.templated,
          title: link.title,
          type: link.type,
          hreflang: link.hreflang,
          attrs: link.attrs
        });
      }
    });

    // Clone embedded resources
    Object.entries(this.embedded).forEach(([rel, resources]) => {
      clone.embed(rel, resources.map(r => r.clone()));
    });

    // Clone state
    clone.setState(this.getState());
    this.stateManager.getTransitions().forEach(transition => {
      clone.addTransition(
        transition.from,
        transition.to,
        transition.name,
        transition.href,
        transition.method,
        transition.conditions
      );
    });

    return clone;
  }

  /**
   * 📦 Converts the resource to a JSON representation
   * 
   * Serializes the resource into a HAL-compliant JSON format, including all
   * properties, links, and embedded resources. This is essential for API
   * responses and client-server communication.
   * 
   * @returns {Record<string, unknown>} The JSON representation
   */
  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      ...this.properties,
      _links: this.getLinks(),
      _embedded: Object.entries(this.embedded).reduce((acc, [rel, resources]) => {
        acc[rel] = resources.map(r => r.toJSON());
        return acc;
      }, {} as Record<string, unknown[]>)
    };

    if (this.type) {
      json._type = this.type;
    }

    if (this.id) {
      json._id = this.id;
    }

    return json;
  }

  /**
   * 🔄 Gets available state transitions
   * 
   * Returns all possible state transitions for the resource's current state,
   * enabling clients to understand what actions are available.
   * 
   * @returns {StateTransition[]} Array of available transitions
   */
  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.getState(), this.getProperties());
  }
} 