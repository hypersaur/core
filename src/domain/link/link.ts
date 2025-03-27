/**
 * Link domain model
 * Represents hypermedia links and link management
 */

import { InvalidArgumentError } from '../../infrastructure/errors/api-error.ts';

/**
 * Link interface
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
 * Type for link that can be a single link or array
 */
export type LinkObject = Link | Link[];

/**
 * Options for links
 */
export interface LinkOptions {
  templated?: boolean;
  title?: string;
  type?: string;
  hreflang?: string;
  attrs?: Record<string, unknown>;
}

/**
 * Standard link relations
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
 * Link Manager class
 */
export class LinkManager {
  private links = new Map<string, LinkObject>();
  
  constructor(initialLinks: Record<string, LinkObject> = {}) {
    if (initialLinks && typeof initialLinks === 'object') {
      Object.entries(initialLinks).forEach(([rel, link]) => {
        this.links.set(rel, link);
      });
    }
  }
  
  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): LinkManager {
    if (typeof rel !== 'string' || !rel) {
      throw new InvalidArgumentError('Link relation must be a non-empty string');
    }
    
    if (typeof href !== 'string' || !href) {
      throw new InvalidArgumentError('Link href must be a non-empty string');
    }
    
    const link: Link = {
      rel,
      href,
      method,
      ...options
    };
    
    const existing = this.links.get(rel);
    
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(link);
      } else {
        this.links.set(rel, [existing, link]);
      }
    } else {
      this.links.set(rel, link);
    }
    
    return this;
  }
  
  removeLink(rel: string): LinkManager {
    this.links.delete(rel);
    return this;
  }
  
  hasLink(rel: string): boolean {
    return this.links.has(rel);
  }
  
  getLink(rel: string): LinkObject | undefined {
    return this.links.get(rel);
  }
  
  getLinks(): Record<string, LinkObject> {
    return Object.fromEntries(this.links.entries());
  }
  
  setLinks(links: Record<string, LinkObject>): LinkManager {
    this.links.clear();
    
    Object.entries(links).forEach(([rel, link]) => {
      this.links.set(rel, link);
    });
    
    return this;
  }
  
  clearLinks(): LinkManager {
    this.links.clear();
    return this;
  }
  
  getLinkRelations(): string[] {
    return Array.from(this.links.keys());
  }
  
  setSelfLink(href: string, method: string = 'GET'): LinkManager {
    return this.addLink('self', href, method);
  }
  
  static createLinkBuilder(baseUrl: string): (path: string, rel: string, method?: string, options?: LinkOptions) => Link {
    return (path: string, rel: string, method: string = 'GET', options: LinkOptions = {}): Link => {
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
  
  clone(): LinkManager {
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