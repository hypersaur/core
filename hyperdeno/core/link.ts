/**
 * Link management for HATEOAS Resources
 * 
 * Handles the creation, storage, and retrieval of hypermedia links.
 * Following the Single Responsibility Principle by focusing only on link management.
 */

import { InvalidArgumentError } from './errors.ts';

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

export type LinkObject = Link | Link[];

export interface LinkOptions {
  templated?: boolean;
  title?: string;
  type?: string;
  hreflang?: string;
  attrs?: Record<string, unknown>;
}

/**
 * Standard link relations as defined by IANA
 * @see https://www.iana.org/assignments/link-relations/link-relations.xhtml
 */
export const STANDARD_RELS = {
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
} as const;

/**
 * Class responsible for managing hypermedia links
 */
export class LinkManager {
  private links = new Map<string, LinkObject>();
  
  /**
   * Create a new link manager
   * @param initialLinks - Optional initial links as a record
   */
  constructor(initialLinks: Record<string, LinkObject> = {}) {
    if (initialLinks && typeof initialLinks === 'object') {
      Object.entries(initialLinks).forEach(([rel, link]) => {
        this.links.set(rel, link);
      });
    }
  }
  
  /**
   * Add a link to the resource
   * @param rel - Link relation
   * @param href - Link URI
   * @param method - HTTP method
   * @param options - Additional link options
   * @returns For chaining
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
   * Remove a link by relation
   * @param rel - Link relation to remove
   * @returns For chaining
   */
  removeLink(rel: string): LinkManager {
    this.links.delete(rel);
    return this;
  }
  
  /**
   * Check if a link relation exists
   * @param rel - Link relation to check
   * @returns True if the relation exists
   */
  hasLink(rel: string): boolean {
    return this.links.has(rel);
  }
  
  /**
   * Get a specific link by relation
   * @param rel - Link relation to get
   * @returns The link object or undefined if not found
   */
  getLink(rel: string): LinkObject | undefined {
    return this.links.get(rel);
  }
  
  /**
   * Get all links
   * @returns All links as a record
   */
  getLinks(): Record<string, LinkObject> {
    return Object.fromEntries(this.links.entries());
  }
  
  /**
   * Replace all links
   * @param links - The new links
   * @returns For chaining
   */
  setLinks(links: Record<string, LinkObject>): LinkManager {
    this.links.clear();
    
    Object.entries(links).forEach(([rel, link]) => {
      this.links.set(rel, link);
    });
    
    return this;
  }
  
  /**
   * Clear all links
   * @returns For chaining
   */
  clearLinks(): LinkManager {
    this.links.clear();
    return this;
  }
  
  /**
   * Get link relations
   * @returns Array of relations
   */
  getLinkRelations(): string[] {
    return Array.from(this.links.keys());
  }
  
  /**
   * Set a self link
   * @param href - The URI
   * @param method - HTTP method
   * @returns For chaining
   */
  setSelfLink(href: string, method: string = 'GET'): LinkManager {
    return this.addLink('self', href, method);
  }
  
  /**
   * Create a link builder function for a base URL
   * @param baseUrl - Base URL for all links
   * @returns A function to create links with this base URL
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