/**
 * 🔗 Link Management for HATEOAS Resources
 * 
 * This module implements the core link management functionality for HATEOAS (Hypertext As The Engine Of Application State).
 * Links are the fundamental building blocks of HATEOAS, enabling clients to navigate through the API by following
 * hyperlinks and discovering available actions.
 * 
 * Key HATEOAS features:
 * - Standard link relations (IANA registered)
 * - URI templates for dynamic links
 * - Link metadata (type, title, language)
 * - Multiple links per relation
 * 
 * @example
 * ```typescript
 * const linkManager = new LinkManager();
 * linkManager.addLink('self', '/users/123');
 * linkManager.addLink('edit', '/users/123/edit', 'PUT');
 * ```
 */

import { InvalidArgumentError } from './errors.ts';

/**
 * 🔗 Interface defining a HATEOAS link structure
 * 
 * Links are the core mechanism for resource discovery and state transitions in HATEOAS.
 * Each link contains metadata about the relationship between resources and how to access them.
 * 
 * @interface Link
 * @property {string} href - The URI template or URL of the link
 * @property {string} [method] - The HTTP method for the link (defaults to 'GET')
 * @property {string} rel - The link relation type
 * @property {boolean} [templated] - Indicates if the href is a URI template
 * @property {string} [title] - Human-readable title for the link
 * @property {string} [type] - The media type of the target resource
 * @property {string} [hreflang] - Language of the target resource
 * @property {Record<string, unknown>} [attrs] - Additional link attributes
 */
export interface Link {
  href: string;
  method?: string;
  rel: string;
  templated?: boolean;
  title?: string;
  type?: string;
  hreflang?: string;
  attrs?: Record<string, unknown>;
}

/**
 * 🔗 Type representing either a single link or an array of links
 * 
 * In HATEOAS, a relation can have multiple links, each representing a different
 * way to access or interact with the related resource.
 * 
 * @type {Link | Link[]}
 */
export type LinkObject = Link | Link[];

/**
 * 🔧 Options for creating or modifying links
 * 
 * These options allow for fine-grained control over link metadata and behavior,
 * enabling rich hypermedia controls in the API.
 * 
 * @interface LinkOptions
 * @property {boolean} [templated] - Whether the link is a URI template
 * @property {string} [title] - Human-readable title for the link
 * @property {string} [type] - Media type of the target resource
 * @property {string} [hreflang] - Language of the target resource
 * @property {Record<string, unknown>} [attrs] - Additional link attributes
 */
export interface LinkOptions {
  templated?: boolean;
  title?: string;
  type?: string;
  hreflang?: string;
  attrs?: Record<string, unknown>;
}

/**
 * 📚 Standard link relations as defined by IANA
 * 
 * These are the standard link relations that are commonly used in HATEOAS APIs.
 * They provide a consistent vocabulary for describing resource relationships and actions.
 * 
 * @see https://www.iana.org/assignments/link-relations/link-relations.xhtml
 */
export const STANDARD_RELS = {
  SELF: 'self',           // Link to the resource itself
  NEXT: 'next',           // Link to the next page in a collection
  PREV: 'prev',           // Link to the previous page in a collection
  FIRST: 'first',         // Link to the first page in a collection
  LAST: 'last',           // Link to the last page in a collection
  COLLECTION: 'collection', // Link to a collection containing this resource
  ITEM: 'item',           // Link to a specific item in a collection
  CREATE: 'create',       // Link to create a new resource
  EDIT: 'edit',           // Link to edit this resource
  DELETE: 'delete',       // Link to delete this resource
  UP: 'up',               // Link to the parent resource
} as const;

/**
 * 🎯 Class responsible for managing hypermedia links
 * 
 * This class implements the link management functionality required by HATEOAS,
 * providing methods for adding, removing, and retrieving links. It maintains
 * the integrity of link relationships and ensures proper link metadata.
 * 
 * @class LinkManager
 */
export class LinkManager {
  private links = new Map<string, LinkObject>();
  
  /**
   * 🎨 Creates a new link manager
   * 
   * Initializes a new link manager with optional initial links. This allows
   * for creating pre-populated link managers with known relationships.
   * 
   * @param {Record<string, LinkObject>} [initialLinks] - Optional initial links
   */
  constructor(initialLinks: Record<string, LinkObject> = {}) {
    if (initialLinks && typeof initialLinks === 'object') {
      Object.entries(initialLinks).forEach(([rel, link]) => {
        this.links.set(rel, link);
      });
    }
  }
  
  /**
   * ➕ Adds a link to the resource
   * 
   * Links are the core mechanism for resource discovery in HATEOAS. This method
   * adds a new link with the specified relation and metadata, supporting both
   * single and multiple links per relation.
   * 
   * @param {string} rel - Link relation (e.g., 'self', 'edit')
   * @param {string} href - Link URI or template
   * @param {string} [method='GET'] - HTTP method for the link
   * @param {LinkOptions} [options] - Additional link options
   * @throws {InvalidArgumentError} If rel or href is invalid
   * @returns {LinkManager} The link manager for chaining
   */
  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): LinkManager {
    if (typeof rel !== 'string' || !rel) {
      throw new InvalidArgumentError('Link relation must be a non-empty string');
    }
    
    if (typeof href !== 'string' || !href) {
      throw new InvalidArgumentError('Link href must be a non-empty string');
    }
    
    // Create the link object
    const link: Link = {
      rel,
      href,
      method,
      ...options
    };
    
    // If this relation already exists
    const existing = this.links.get(rel);
    
    if (existing) {
      // If it's already an array, add to it
      if (Array.isArray(existing)) {
        existing.push(link);
      } else {
        // Convert to array with both links
        this.links.set(rel, [existing, link]);
      }
    } else {
      // Create new link entry
      this.links.set(rel, link);
    }
    
    return this;
  }
  
  /**
   * ❌ Removes a link by relation
   * 
   * Removes a link and its associated metadata, which is useful when a
   * particular action or relationship is no longer available.
   * 
   * @param {string} rel - Link relation to remove
   * @returns {LinkManager} The link manager for chaining
   */
  removeLink(rel: string): LinkManager {
    this.links.delete(rel);
    return this;
  }
  
  /**
   * 🔍 Checks if a link relation exists
   * 
   * Allows clients to check for the availability of specific actions or
   * relationships before attempting to use them.
   * 
   * @param {string} rel - Link relation to check
   * @returns {boolean} True if the relation exists
   */
  hasLink(rel: string): boolean {
    return this.links.has(rel);
  }
  
  /**
   * 🔗 Gets a specific link by relation
   * 
   * Retrieves a link object or array of links for a given relation,
   * enabling clients to discover available actions and relationships.
   * 
   * @param {string} rel - Link relation to get
   * @returns {LinkObject | undefined} The link object(s) if found
   */
  getLink(rel: string): LinkObject | undefined {
    return this.links.get(rel);
  }
  
  /**
   * 📚 Gets all links
   * 
   * Returns all available links, enabling clients to discover all possible
   * actions and relationships associated with the resource.
   * 
   * @returns {Record<string, LinkObject>} All links indexed by relation
   */
  getLinks(): Record<string, LinkObject> {
    return Object.fromEntries(this.links.entries());
  }
  
  /**
   * 🔄 Replaces all links
   * 
   * Replaces the entire set of links with new ones, which is useful for
   * updating the resource's available actions and relationships.
   * 
   * @param {Record<string, LinkObject>} links - The new links
   * @returns {LinkManager} The link manager for chaining
   */
  setLinks(links: Record<string, LinkObject>): LinkManager {
    this.links.clear();
    
    Object.entries(links).forEach(([rel, link]) => {
      this.links.set(rel, link);
    });
    
    return this;
  }
  
  /**
   * 🗑️ Clears all links
   * 
   * Removes all links from the resource, which can be useful when
   * resetting the resource's state or preparing for a new set of links.
   * 
   * @returns {LinkManager} The link manager for chaining
   */
  clearLinks(): LinkManager {
    this.links.clear();
    return this;
  }
  
  /**
   * 📋 Gets all link relations
   * 
   * Returns an array of all available link relations, which is useful
   * for discovering what actions and relationships are available.
   * 
   * @returns {string[]} Array of link relations
   */
  getLinkRelations(): string[] {
    return Array.from(this.links.keys());
  }
  
  /**
   * 🏠 Sets a self-referential link
   * 
   * The self link is a fundamental concept in HATEOAS, providing the canonical
   * URI for the resource. This method provides a convenient way to set it.
   * 
   * @param {string} href - The URI
   * @param {string} [method='GET'] - HTTP method
   * @returns {LinkManager} The link manager for chaining
   */
  setSelfLink(href: string, method: string = 'GET'): LinkManager {
    return this.addLink('self', href, method);
  }
  
  /**
   * 🏗️ Creates a link builder function for a base URL
   * 
   * This factory method creates a function that helps build links with a
   * consistent base URL, which is useful for maintaining consistent URIs
   * throughout the API.
   * 
   * @param {string} baseUrl - Base URL for all links
   * @returns {Function} A function to create links with this base URL
   */
  static createLinkBuilder(baseUrl: string): (path: string, rel: string, method?: string, options?: LinkOptions) => Link {
    return (path: string, rel: string, method: string = 'GET', options: LinkOptions = {}): Link => {
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
   * @returns A new link manager with the same links
   */
  clone(): LinkManager {
    // Create a deep copy of the links
    const clonedLinks: Record<string, LinkObject> = {};
    
    this.links.forEach((linkOrLinks, rel) => {
      if (Array.isArray(linkOrLinks)) {
        clonedLinks[rel] = linkOrLinks.map(link => ({ ...link }));
      } else {
        clonedLinks[rel] = { ...linkOrLinks };
      }
    });
    
    return new LinkManager(clonedLinks);
  }
} 