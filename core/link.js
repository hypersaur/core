/**
 * Link management for HATEOAS Resources
 * 
 * Handles the creation, storage, and retrieval of hypermedia links.
 * Following the Single Responsibility Principle by focusing only on link management.
 */

import { InvalidArgumentError } from './errors.js';

/**
 * @typedef {Object} Link
 * @property {string} href - Link URI
 * @property {string} [method='GET'] - HTTP method
 * @property {string} rel - Link relation
 * @property {boolean} [templated=false] - Whether the link is a URI template
 * @property {string} [title] - Human-readable title
 * @property {string} [type] - Expected media type
 * @property {string} [hreflang] - Language of the linked resource
 * @property {Object} [attrs] - Additional attributes
 */

/**
 * @typedef {Link|Link[]} LinkObject - Either a single link or array of links
 */

/**
 * @typedef {Object} LinkOptions
 * @property {boolean} [templated] - Whether the link is a URI template
 * @property {string} [title] - Human-readable title
 * @property {string} [type] - Expected media type
 * @property {string} [hreflang] - Language of the linked resource
 * @property {Object} [attrs] - Additional attributes
 */

/**
 * Standard link relations as defined by IANA
 * @see https://www.iana.org/assignments/link-relations/link-relations.xhtml
 */
const STANDARD_RELS = {
  SELF: 'self',
  NEXT: 'next',
  PREV: 'prev',
  FIRST: 'first',
  LAST: 'last',
  COLLECTION: 'collection',
  ITEM: 'item',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  UP: 'up',
};

/**
 * Class responsible for managing hypermedia links
 */
class LinkManager {
  #links = new Map();
  
  /**
   * Create a new link manager
   * @param {Object} [initialLinks] - Optional initial links as a record
   */
  constructor(initialLinks = {}) {
    if (initialLinks && typeof initialLinks === 'object') {
      Object.entries(initialLinks).forEach(([rel, link]) => {
        this.#links.set(rel, link);
      });
    }
  }
  
  /**
   * Add a link to the resource
   * @param {string} rel - Link relation
   * @param {string} href - Link URI
   * @param {string} [method='GET'] - HTTP method
   * @param {LinkOptions} [options] - Additional link options
   * @returns {LinkManager} For chaining
   */
  addLink(rel, href, method = 'GET', options = {}) {
    if (typeof rel !== 'string' || !rel) {
      throw new InvalidArgumentError('Link relation must be a non-empty string');
    }
    
    if (typeof href !== 'string' || !href) {
      throw new InvalidArgumentError('Link href must be a non-empty string');
    }
    
    // Create the link object
    const link = {
      rel,
      href,
      method,
      ...options
    };
    
    // If this relation already exists
    const existing = this.#links.get(rel);
    
    if (existing) {
      // If it's already an array, add to it
      if (Array.isArray(existing)) {
        existing.push(link);
      } else {
        // Convert to array with both links
        this.#links.set(rel, [existing, link]);
      }
    } else {
      // Create new link entry
      this.#links.set(rel, link);
    }
    
    return this;
  }
  
  /**
   * Remove a link by relation
   * @param {string} rel - Link relation to remove
   * @returns {LinkManager} For chaining
   */
  removeLink(rel) {
    this.#links.delete(rel);
    return this;
  }
  
  /**
   * Check if a link relation exists
   * @param {string} rel - Link relation to check
   * @returns {boolean} True if the relation exists
   */
  hasLink(rel) {
    return this.#links.has(rel);
  }
  
  /**
   * Get a specific link by relation
   * @param {string} rel - Link relation to get
   * @returns {LinkObject|undefined} The link object or undefined if not found
   */
  getLink(rel) {
    return this.#links.get(rel);
  }
  
  /**
   * Get all links
   * @returns {Object} All links as a record
   */
  getLinks() {
    return Object.fromEntries(this.#links.entries());
  }
  
  /**
   * Replace all links
   * @param {Object} links - The new links
   * @returns {LinkManager} For chaining
   */
  setLinks(links) {
    this.#links.clear();
    
    Object.entries(links).forEach(([rel, link]) => {
      this.#links.set(rel, link);
    });
    
    return this;
  }
  
  /**
   * Clear all links
   * @returns {LinkManager} For chaining
   */
  clearLinks() {
    this.#links.clear();
    return this;
  }
  
  /**
   * Get link relations
   * @returns {string[]} Array of relations
   */
  getLinkRelations() {
    return Array.from(this.#links.keys());
  }
  
  /**
   * Set a self link
   * @param {string} href - The URI
   * @param {string} [method='GET'] - HTTP method
   * @returns {LinkManager} For chaining
   */
  setSelfLink(href, method = 'GET') {
    return this.addLink('self', href, method);
  }
  
  /**
   * Create a link builder function for a base URL
   * @param {string} baseUrl - Base URL for all links
   * @returns {Function} A function to create links with this base URL
   */
  static createLinkBuilder(baseUrl) {
    return (path, rel, method = 'GET', options = {}) => {
      // Handle trailing slash in baseUrl and leading slash in path
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const href = `${normalizedBase}${normalizedPath}`;
      
      return {
        rel,
        href,
        method,
        ...options
      };
    };
  }
  
  /**
   * Clone the link manager
   * @returns {LinkManager} A new link manager with the same links
   */
  clone() {
    // Create a deep copy of the links
    const clonedLinks = {};
    
    this.#links.forEach((linkOrLinks, rel) => {
      if (Array.isArray(linkOrLinks)) {
        clonedLinks[rel] = linkOrLinks.map(link => ({ ...link }));
      } else {
        clonedLinks[rel] = { ...linkOrLinks };
      }
    });
    
    return new LinkManager(clonedLinks);
  }
}

export { LinkManager, STANDARD_RELS };