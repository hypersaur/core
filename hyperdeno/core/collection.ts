/**
 * Collection class for HATEOAS Resources
 * 
 * Represents a collection of resources with pagination support.
 * Extends Resource to inherit link management and other basic functionality.
 */

import { Resource } from './resource.ts';
import { InvalidArgumentError } from './errors.ts';

/**
 * Pagination information interface
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
}

/**
 * Collection class for managing groups of resources
 */
export class Collection extends Resource {
  #items: Resource[] = [];
  #pagination: PaginationInfo | null = null;
  #collectionName = 'items';
  
  /**
   * Create a new collection
   * @param options - Collection options
   */
  constructor(options: CollectionOptions = {}) {
    super({
      type: options.type || 'collection',
      id: options.id,
      properties: options.properties || {}
    });
    
    if (options.items && Array.isArray(options.items)) {
      this.addItems(options.items);
    }
  }
  
  /**
   * Set the name used for the embedded collection
   * @param name - Collection name
   * @returns For chaining
   */
  setCollectionName(name: string): Collection {
    if (typeof name !== 'string' || !name) {
      throw new InvalidArgumentError('Collection name must be a non-empty string');
    }
    
    this.#collectionName = name;
    return this;
  }
  
  /**
   * Get the collection name
   * @returns Collection name
   */
  getCollectionName(): string {
    return this.#collectionName;
  }
  
  /**
   * Add an item to the collection
   * @param item - Resource to add
   * @returns For chaining
   */
  addItem(item: Resource): Collection {
    if (!(item instanceof Resource)) {
      throw new InvalidArgumentError('Item must be a Resource instance');
    }
    
    this.#items.push(item);
    return this;
  }
  
  /**
   * Add multiple items to the collection
   * @param items - Resources to add
   * @returns For chaining
   */
  addItems(items: Resource[]): Collection {
    if (!Array.isArray(items)) {
      throw new InvalidArgumentError('Items must be an array');
    }
    
    for (const item of items) {
      if (!(item instanceof Resource)) {
        throw new InvalidArgumentError('Each item must be a Resource instance');
      }
    }
    
    this.#items.push(...items);
    return this;
  }
  
  /**
   * Get all items in the collection
   * @returns Collection items
   */
  getItems(): Resource[] {
    return [...this.#items];
  }
  
  /**
   * Get the number of items in the collection
   * @returns Item count
   */
  getCount(): number {
    return this.#items.length;
  }
  
  /**
   * Set pagination information
   * @param pagination - Pagination info
   * @returns For chaining
   */
  setPagination(pagination: PaginationInfo): Collection {
    if (typeof pagination !== 'object' || pagination === null) {
      throw new InvalidArgumentError('Pagination must be an object');
    }
    
    if (typeof pagination.page !== 'number' || pagination.page < 1) {
      throw new InvalidArgumentError('Page must be a positive number');
    }
    
    if (typeof pagination.pageSize !== 'number' || pagination.pageSize < 1) {
      throw new InvalidArgumentError('Page size must be a positive number');
    }
    
    if (typeof pagination.total !== 'number' || pagination.total < 0) {
      throw new InvalidArgumentError('Total must be a non-negative number');
    }
    
    this.#pagination = { ...pagination };
    return this;
  }
  
  /**
   * Set the current page number
   * @param page - Page number (1-based)
   * @returns For chaining
   */
  setPage(page: number): Collection {
    if (typeof page !== 'number' || page < 1) {
      throw new InvalidArgumentError('Page must be a positive number');
    }
    
    if (!this.#pagination) {
      this.#pagination = { page, pageSize: 10, total: 0 };
    } else {
      this.#pagination.page = page;
    }
    
    return this;
  }
  
  /**
   * Set the page size
   * @param pageSize - Items per page
   * @returns For chaining
   */
  setPageSize(pageSize: number): Collection {
    if (typeof pageSize !== 'number' || pageSize < 1) {
      throw new InvalidArgumentError('Page size must be a positive number');
    }
    
    if (!this.#pagination) {
      this.#pagination = { page: 1, pageSize, total: 0 };
    } else {
      this.#pagination.pageSize = pageSize;
    }
    
    return this;
  }
  
  /**
   * Set the total number of items across all pages
   * @param total - Total item count
   * @returns For chaining
   */
  setTotal(total: number): Collection {
    if (typeof total !== 'number' || total < 0) {
      throw new InvalidArgumentError('Total must be a non-negative number');
    }
    
    if (!this.#pagination) {
      this.#pagination = { page: 1, pageSize: 10, total };
    } else {
      this.#pagination.total = total;
    }
    
    return this;
  }
  
  /**
   * Get pagination information
   * @returns Pagination info or null if not set
   */
  getPagination(): PaginationInfo | null {
    return this.#pagination ? { ...this.#pagination } : null;
  }
  
  /**
   * Calculate the total number of pages based on pagination
   * @returns Total pages or 0 if pagination not set
   */
  getTotalPages(): number {
    if (!this.#pagination) return 0;
    
    const { total, pageSize } = this.#pagination;
    if (total === 0) return 0;
    
    return Math.ceil(total / pageSize);
  }
  
  /**
   * Add pagination links to the collection
   * @param baseUrl - Base URL for pagination links
   * @returns For chaining
   */
  addPaginationLinks(baseUrl: string): Collection {
    if (!this.#pagination) {
      return this;
    }
    
    const { page, pageSize } = this.#pagination;
    const totalPages = this.getTotalPages();
    
    // Remove any existing pagination links
    for (const rel of ['self', 'first', 'last', 'prev', 'next']) {
      this.removeLink(rel);
    }
    
    // Add self link for current page
    this.addLink('self', `${baseUrl}?page=${page}&pageSize=${pageSize}`);
    
    // First page
    this.addLink('first', `${baseUrl}?page=1&pageSize=${pageSize}`);
    
    // Last page (if there are pages)
    if (totalPages > 0) {
      this.addLink('last', `${baseUrl}?page=${totalPages}&pageSize=${pageSize}`);
    }
    
    // Previous page (if not on first page)
    if (page > 1) {
      this.addLink('prev', `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`);
    }
    
    // Next page (if not on last page)
    if (page < totalPages) {
      this.addLink('next', `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`);
    }
    
    return this;
  }
  
  /**
   * Create a paginated collection
   * @param items - Collection items
   * @param page - Current page
   * @param pageSize - Items per page
   * @param total - Total items
   * @returns New collection instance
   */
  static paginated(items: Resource[], page: number, pageSize: number, total: number): Collection {
    return new Collection()
      .addItems(items)
      .setPage(page)
      .setPageSize(pageSize)
      .setTotal(total);
  }
  
  /**
   * Convert the collection to a JSON object
   * @returns JSON representation
   */
  override toJSON(): Record<string, unknown> {
    const json = super.toJSON();
    
    // Add items
    json[this.#collectionName] = this.#items.map(item => item.toJSON());
    
    // Add pagination info if set
    if (this.#pagination) {
      json._pagination = { ...this.#pagination };
    }
    
    return json;
  }
} 