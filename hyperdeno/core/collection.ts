/**
 * Collection class for HATEOAS Resources
 * 
 * Represents a collection of resources with pagination support.
 * Extends Resource to inherit link management and other basic functionality.
 * 
 * @example
 * ```typescript
 * const collection = new Collection({
 *   type: 'users',
 *   items: [user1, user2, user3]
 * });
 * 
 * collection.setPagination({
 *   page: 1,
 *   pageSize: 10,
 *   total: 100
 * });
 * 
 * collection.addPaginationLinks('/api/users');
 * ```
 */

import { Resource } from './resource.ts';
import { InvalidArgumentError } from './errors.ts';

/**
 * Interface representing pagination information for a collection
 * @interface PaginationInfo
 * @property {number} page - The current page number (1-based)
 * @property {number} pageSize - Number of items per page
 * @property {number} total - Total number of items across all pages
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Options for creating a new Collection instance
 * @interface CollectionOptions
 * @property {string} [type] - The type of the collection (e.g., 'users', 'posts')
 * @property {string} [id] - The unique identifier of the collection
 * @property {Record<string, unknown>} [properties] - Additional properties for the collection
 * @property {Resource[]} [items] - Initial items to add to the collection
 */
export interface CollectionOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  items?: Resource[];
}

/**
 * Collection class for managing groups of resources with pagination support
 * @class Collection
 * @extends {Resource}
 */
export class Collection extends Resource {
  #items: Resource[] = [];
  #pagination: PaginationInfo | null = null;
  #collectionName = 'items';
  
  /**
   * Creates a new Collection instance
   * @param {CollectionOptions} options - Configuration options for the collection
   */
  constructor(options: CollectionOptions = {}) {
    super({
      ...options,
      type: options.type || 'collection'
    });
    if (options.items && Array.isArray(options.items)) {
      this.addItems(options.items);
    }
    this.#pagination = null;
  }
  
  /**
   * Sets the name used for the embedded collection in JSON representation
   * @param {string} name - The name to use for the collection (e.g., 'users', 'posts')
   * @throws {InvalidArgumentError} If name is not a non-empty string
   * @returns {Collection} The collection instance for method chaining
   */
  setCollectionName(name: string): Collection {
    if (typeof name !== 'string' || !name) {
      throw new InvalidArgumentError('Collection name must be a non-empty string');
    }
    
    this.#collectionName = name;
    return this;
  }
  
  /**
   * Gets the name used for the embedded collection
   * @returns {string} The collection name
   */
  getCollectionName(): string {
    return this.#collectionName;
  }
  
  /**
   * Adds a single resource to the collection
   * @param {Resource} item - The resource to add
   * @throws {InvalidArgumentError} If item is not a Resource instance
   * @returns {Collection} The collection instance for method chaining
   */
  addItem(item: Resource): Collection {
    if (!(item instanceof Resource)) {
      throw new InvalidArgumentError('Item must be a Resource instance');
    }
    
    this.#items.push(item);
    return this;
  }
  
  /**
   * Adds multiple resources to the collection
   * @param {Resource[]} items - Array of resources to add
   * @throws {InvalidArgumentError} If items is not an array or contains non-Resource items
   * @returns {Collection} The collection instance for method chaining
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
   * Gets all items in the collection
   * @returns {Resource[]} A copy of the collection's items
   */
  getItems(): Resource[] {
    return [...this.#items];
  }
  
  /**
   * Gets the number of items in the collection
   * @returns {number} The current number of items
   */
  getCount(): number {
    return this.#items.length;
  }
  
  /**
   * Sets pagination information for the collection
   * @param {PaginationInfo} pagination - The pagination information to set
   * @throws {InvalidArgumentError} If pagination info is invalid
   * @returns {Collection} The collection instance for method chaining
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
   * Sets the current page number
   * @param {number} page - The page number (1-based)
   * @throws {InvalidArgumentError} If page is not a positive number
   * @returns {Collection} The collection instance for method chaining
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
   * Sets the number of items per page
   * @param {number} pageSize - The number of items per page
   * @throws {InvalidArgumentError} If pageSize is not a positive number
   * @returns {Collection} The collection instance for method chaining
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
   * Sets the total number of items across all pages
   * @param {number} total - The total number of items
   * @throws {InvalidArgumentError} If total is not a non-negative number
   * @returns {Collection} The collection instance for method chaining
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
   * Gets the current pagination information
   * @returns {PaginationInfo|null} A copy of the pagination info or null if not set
   */
  getPagination(): PaginationInfo | null {
    return this.#pagination ? { ...this.#pagination } : null;
  }
  
  /**
   * Calculates the total number of pages based on pagination settings
   * @returns {number} The total number of pages or 0 if pagination is not set
   */
  getTotalPages(): number {
    if (!this.#pagination) return 0;
    
    const { total, pageSize } = this.#pagination;
    if (total === 0) return 0;
    
    return Math.ceil(total / pageSize);
  }
  
  /**
   * Adds standard pagination links to the collection
   * @param {string} baseUrl - The base URL for pagination links
   * @returns {Collection} The collection instance for method chaining
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
   * Creates a new paginated collection with the given items
   * @param {Resource[]} items - The items to include in the collection
   * @param {number} page - The current page number
   * @param {number} pageSize - The number of items per page
   * @param {number} total - The total number of items
   * @returns {Collection} A new collection instance with pagination
   */
  static paginated(items: Resource[], page: number, pageSize: number, total: number): Collection {
    return new Collection()
      .addItems(items)
      .setPage(page)
      .setPageSize(pageSize)
      .setTotal(total);
  }
  
  /**
   * Converts the collection to a JSON object
   * @returns {Record<string, unknown>} The collection as a JSON object
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
  
  /**
   * Sorts the collection items using the provided comparison function
   * @param {Function} compareFn - The comparison function to use for sorting
   * @returns {Collection} The collection instance for method chaining
   */
  sort(compareFn: (a: Resource, b: Resource) => number): Collection {
    this.#items.sort(compareFn);
    return this;
  }
  
  /**
   * Filters the collection items using the provided predicate function
   * @param {Function} predicate - The predicate function to use for filtering
   * @returns {Resource[]} The filtered array of resources
   */
  filter(predicate: (item: Resource) => boolean): Resource[] {
    return this.#items.filter(predicate);
  }
} 