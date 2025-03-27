/**
 * Collection domain model
 * Represents a collection of resources with pagination and navigation
 */

import { Resource } from '../resource/resource.ts';
import { LinkManager } from '../link/link.ts';
import { InvalidArgumentError } from '../../infrastructure/errors/api-error.ts';

/**
 * Pagination info interface
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Collection options interface
 */
export interface CollectionOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  items?: Resource[];
  pagination?: PaginationInfo;
}

/**
 * Collection class for HATEOAS resources
 */
export class Collection {
  private items: Resource[] = [];
  private pagination: PaginationInfo | null = null;
  private resource: Resource;
  private collectionName: string = 'items';
  
  constructor(options: CollectionOptions = {}) {
    this.resource = new Resource({
      type: options.type || 'collection',
      id: options.id,
      properties: options.properties
    });
    
    if (options.items && Array.isArray(options.items)) {
      this.addItems(options.items);
    }
    
    if (options.pagination) {
      this.setPagination(options.pagination);
    }
  }
  
  getType(): string {
    return this.resource.getType();
  }
  
  setType(type: string): Collection {
    this.resource.setType(type);
    return this;
  }
  
  getId(): string {
    return this.resource.getId();
  }
  
  setId(id: string): Collection {
    this.resource.setId(id);
    return this;
  }
  
  setProperty(key: string, value: unknown): Collection {
    this.resource.setProperty(key, value);
    return this;
  }
  
  getProperty(key: string): unknown {
    return this.resource.getProperty(key);
  }
  
  getProperties(): Record<string, unknown> {
    return this.resource.getProperties();
  }
  
  addItem(item: Resource): Collection {
    if (!(item instanceof Resource)) {
      throw new InvalidArgumentError('Collection items must be Resource instances');
    }
    this.items.push(item);
    return this;
  }
  
  addItems(items: Resource[]): Collection {
    if (!Array.isArray(items)) {
      throw new InvalidArgumentError('Items must be an array');
    }
    
    items.forEach(item => {
      if (!(item instanceof Resource)) {
        throw new InvalidArgumentError('Collection items must be Resource instances');
      }
      this.items.push(item);
    });
    
    return this;
  }
  
  getItems(): Resource[] {
    return [...this.items];
  }
  
  getCount(): number {
    return this.items.length;
  }
  
  sort(compareFn: (a: Resource, b: Resource) => number): Collection {
    this.items.sort(compareFn);
    return this;
  }
  
  filter(predicate: (item: Resource) => boolean): Resource[] {
    return this.items.filter(predicate);
  }
  
  setPagination(pagination: PaginationInfo | null): Collection {
    this.pagination = pagination ? { ...pagination } : null;
    return this;
  }
  
  getPagination(): PaginationInfo | null {
    return this.pagination ? { ...this.pagination } : null;
  }
  
  setPage(page: number): void {
    if (!this.pagination) {
      this.pagination = { page, pageSize: 10, total: 0 };
    } else {
      this.pagination.page = page;
    }
  }
  
  setPageSize(pageSize: number): void {
    if (!this.pagination) {
      this.pagination = { page: 1, pageSize, total: 0 };
    } else {
      this.pagination.pageSize = pageSize;
    }
  }
  
  setTotal(total: number): void {
    if (!this.pagination) {
      this.pagination = { page: 1, pageSize: 10, total };
    } else {
      this.pagination.total = total;
    }
  }
  
  addLink(rel: string, href: string, method: string = 'GET', options: any = {}): Collection {
    this.resource.addLink(rel, href, method, options);
    return this;
  }
  
  getLink(rel: string): any {
    return this.resource.getLink(rel);
  }
  
  getLinks(): Record<string, any> {
    return this.resource.getLinks();
  }
  
  addPaginationLinks(baseUrl: string): Collection {
    if (!this.pagination) return this;

    const { page, pageSize, total } = this.pagination;
    const totalPages = Math.ceil(total / pageSize);
    
    // Remove any existing pagination links
    this.resource.removeLink('first');
    this.resource.removeLink('prev');
    this.resource.removeLink('next');
    this.resource.removeLink('last');
    
    // Add new pagination links
    this.resource.addLink('first', `${baseUrl}?page=1&pageSize=${pageSize}`);
    
    if (page > 1) {
      this.resource.addLink('prev', `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`);
    }
    
    if (page < totalPages) {
      this.resource.addLink('next', `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`);
    }
    
    this.resource.addLink('last', `${baseUrl}?page=${totalPages}&pageSize=${pageSize}`);
    
    return this;
  }
  
  setCollectionName(name: string): Collection {
    this.collectionName = name;
    return this;
  }
  
  getCollectionName(): string {
    return this.collectionName;
  }
  
  toJSON(): Record<string, unknown> {
    const json = this.resource.toJSON();
    
    // Add items as embedded resources
    json.embedded = {
      [this.collectionName]: this.items.map(item => item.toJSON())
    };
    
    if (this.pagination) {
      json.pagination = this.pagination;
    }
    
    return json;
  }
} 