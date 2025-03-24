/**
 * Resource class for HATEOAS Resources
 * 
 * Represents an API resource with properties, links, and state transitions.
 * Follows the Single Responsibility Principle by focusing only on resource
 * representation, delegating link management to LinkManager.
 */

import { LinkManager } from './link.js';
import { ResourceState } from './state.js';
import { InvalidArgumentError } from './errors.js';

/**
 * @typedef {Object} ResourceOptions
 * @property {string} [type] - Resource type
 * @property {string} [id] - Resource identifier
 * @property {Object} [properties] - Resource properties
 */

class Resource {
  #type = '';
  #id = '';
  #properties = {};
  #linkManager;
  #stateManager;
  #embedded = {};

  /**
   * Create a new resource
   * @param {ResourceOptions} [options] - Resource options
   */
  constructor(options = {}) {
    this.#linkManager = new LinkManager();
    this.#stateManager = new ResourceState();
    
    if (options.type) this.setType(options.type);
    if (options.id) this.setId(options.id);
    if (options.properties) this.setProperties(options.properties);
  }

  /**
   * Set the resource type
   * @param {string} type - Resource type
   * @returns {Resource} The resource instance for chaining
   */
  setType(type) {
    if (typeof type !== 'string') {
      throw new InvalidArgumentError('Resource type must be a string');
    }
    this.#type = type;
    return this;
  }

  /**
   * Get the resource type
   * @returns {string} The resource type
   */
  getType() {
    return this.#type;
  }

  /**
   * Set the resource ID
   * @param {string} id - Resource ID
   * @returns {Resource} The resource instance for chaining
   */
  setId(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
      throw new InvalidArgumentError('Resource ID must be a string or number');
    }
    this.#id = String(id);
    return this;
  }

  /**
   * Get the resource ID
   * @returns {string} The resource ID
   */
  getId() {
    return this.#id;
  }

  /**
   * Set a resource property
   * @param {string} key - Property name
   * @param {*} value - Property value
   * @returns {Resource} The resource instance for chaining
   */
  setProperty(key, value) {
    if (typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a string');
    }
    this.#properties[key] = value;
    return this;
  }

  /**
   * Set multiple properties at once
   * @param {Object} properties - Properties object
   * @returns {Resource} The resource instance for chaining
   */
  setProperties(properties) {
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
   * @param {string} key - Property name
   * @returns {*} The property value or undefined if not found
   */
  getProperty(key) {
    return this.#properties[key];
  }

  /**
   * Get all resource properties
   * @returns {Object} All properties
   */
  getProperties() {
    return { ...this.#properties };
  }

  /**
   * Add a link to the resource
   * @param {string} rel - Link relation
   * @param {string} href - Link URI
   * @param {string} [method='GET'] - HTTP method
   * @param {Object} [options] - Additional link options
   * @returns {Resource} The resource instance for chaining
   */
  addLink(rel, href, method = 'GET', options = {}) {
    this.#linkManager.addLink(rel, href, method, options);
    return this;
  }

  /**
   * Add a templated link (URI Template) to the resource
   * @param {string} rel - Link relation
   * @param {string} template - URI template
   * @param {string} [method='GET'] - HTTP method
   * @param {Object} [options] - Additional link options
   * @returns {Resource} The resource instance for chaining
   */
  addTemplatedLink(rel, template, method = 'GET', options = {}) {
    this.#linkManager.addLink(rel, template, method, { ...options, templated: true });
    return this;
  }

  /**
   * Get a link by relation
   * @param {string} rel - Link relation
   * @returns {Object|Object[]|undefined} The link, links array, or undefined if not found
   */
  getLink(rel) {
    return this.#linkManager.getLink(rel);
  }

  /**
   * Get the self link href
   * @returns {string|undefined} The self link href or undefined if not found
   */
  getSelfLink() {
    const selfLink = this.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  /**
   * Get all links
   * @returns {Object} All links grouped by relation
   */
  getLinks() {
    return this.#linkManager.getLinks();
  }

  /**
   * Check if a link relation exists
   * @param {string} rel - Link relation
   * @returns {boolean} True if the relation exists
   */
  hasLink(rel) {
    return this.#linkManager.hasLink(rel);
  }

  /**
   * Remove a link by relation
   * @param {string} rel - Link relation
   * @returns {Resource} The resource instance for chaining
   */
  removeLink(rel) {
    this.#linkManager.removeLink(rel);
    return this;
  }

  /**
   * Embed a related resource
   * @param {string} rel - Relation to the parent resource
   * @param {Resource|Resource[]} resource - Resource(s) to embed
   * @returns {Resource} The resource instance for chaining
   */
  embed(rel, resource) {
    if (!this.#embedded[rel]) {
      this.#embedded[rel] = [];
    }
    
    if (Array.isArray(resource)) {
      this.#embedded[rel] = [...this.#embedded[rel], ...resource];
    } else {
      this.#embedded[rel].push(resource);
    }
    
    return this;
  }

  /**
   * Get embedded resources
   * @param {string} [rel] - Optional relation to retrieve specific embedded resources
   * @returns {Object|Resource[]|undefined} Embedded resources
   */
  getEmbedded(rel) {
    if (rel) {
      return this.#embedded[rel];
    }
    
    return { ...this.#embedded };
  }

  /**
   * Check if the resource has embedded resources with a relation
   * @param {string} rel - Relation to check
   * @returns {boolean} True if the resource has embedded resources with the relation
   */
  hasEmbedded(rel) {
    return !!this.#embedded[rel] && this.#embedded[rel].length > 0;
  }

  /**
   * Set the resource state
   * @param {string} state - The new state
   * @returns {Resource} The resource instance for chaining
   */
  setState(state) {
    this.#stateManager.setState(state);
    return this;
  }

  /**
   * Get the current resource state
   * @returns {string} The current state
   */
  getState() {
    return this.#stateManager.getState();
  }

  /**
   * Add a state transition
   * @param {string} from - Starting state
   * @param {string} to - Target state
   * @param {string} name - Transition name
   * @param {string} href - URI for the transition
   * @param {string} [method='POST'] - HTTP method
   * @param {Object} [conditions] - Conditions for the transition
   * @returns {Resource} The resource instance for chaining
   */
  addStateTransition(from, to, name, href, method = 'POST', conditions) {
    const transition = this.#stateManager.addTransition(from, to, name, href, method, conditions);
    
    // Add a link for the transition if we're in the 'from' state
    if (this.getState() === from) {
      this.addLink(name, href, method);
    }
    
    return this;
  }

  /**
   * Get available transitions from the current state
   * @returns {Array} Available transitions
   */
  getAvailableTransitions() {
    return this.#stateManager.getAvailableTransitions(this.getState(), this.#properties);
  }

  /**
   * Apply a state transition
   * @param {string} transitionName - Name of the transition to apply
   * @returns {Resource} The resource instance for chaining
   */
  applyTransition(transitionName) {
    const newState = this.#stateManager.applyTransition(
      this.getState(), 
      transitionName, 
      this.#properties
    );
    
    return this.setState(newState);
  }

  /**
   * Clone the resource
   * @returns {Resource} A new resource with the same data
   */
  clone() {
    const clone = new Resource({
      type: this.#type,
      id: this.#id,
      properties: { ...this.#properties }
    });
    
    // Copy links
    for (const [rel, link] of Object.entries(this.getLinks())) {
      if (Array.isArray(link)) {
        link.forEach(l => clone.addLink(rel, l.href, l.method, { ...l }));
      } else {
        clone.addLink(rel, link.href, link.method, { ...link });
      }
    }
    
    // Copy embedded resources
    for (const [rel, resources] of Object.entries(this.#embedded)) {
      resources.forEach(resource => {
        clone.embed(rel, resource.clone());
      });
    }
    
    // Copy state
    clone.setState(this.getState());
    
    return clone;
  }

  /**
   * Convert the resource to a JSON object
   * This is called automatically by JSON.stringify()
   * @returns {Object} JSON representation of the resource
   */
  toJSON() {
    const result = {
      ...this.#properties
    };
    
    if (this.#id) {
      result.id = this.#id;
    }
    
    if (this.#type) {
      result._type = this.#type;
    }
    
    const state = this.getState();
    if (state) {
      result._state = state;
    }
    
    // Add links
    const links = this.getLinks();
    if (Object.keys(links).length > 0) {
      result._links = links;
    }
    
    // Add embedded resources
    if (Object.keys(this.#embedded).length > 0) {
      result._embedded = {};
      
      for (const [rel, resources] of Object.entries(this.#embedded)) {
        result._embedded[rel] = resources.map(resource => resource.toJSON());
      }
    }
    
    return result;
  }
}

export { Resource };