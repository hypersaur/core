/**
 * 📚 Collection class for HATEOAS Resources
 * 
 * This class implements a HATEOAS-compliant collection of resources with pagination support.
 * Collections are a fundamental concept in HATEOAS, representing groups of related resources
 * that can be navigated and manipulated as a whole.
 * 
 * Key HATEOAS features:
 * - Pagination support with first/next/prev/last links
 * - Self-descriptive messages with collection metadata
 * - Embedded resources for efficient representation
 * - Consistent link relations for navigation
 * 
 * @example
 * ```typescript
 * const users = createCollection({
 *   type: 'users',
 *   items: [user1, user2, user3],
 *   pagination: {
 *     page: 1,
 *     pageSize: 10,
 *     total: 100
 *   },
 *   links: {
 *     self: '/api/users'
 *   }
 * });
 * ```
 */

import { Resource } from './resource.ts';
import { InvalidArgumentError } from './errors.ts';

/**
 * 📊 Interface representing pagination information for a collection
 * 
 * Pagination is a crucial aspect of HATEOAS collections, enabling efficient
 * navigation through large sets of resources. This interface defines the
 * metadata needed for pagination and link generation.
 * 
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
 * 🔧 Options for creating a new Collection instance
 * 
 * These options define the initial state of a HATEOAS collection, including
 * its type, identifier, properties, and initial items. The collection type
 * is particularly important for client-side processing and relationship
 * management.
 * 
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
 * 📚 Collection class for managing groups of resources with pagination support
 * 
 * This class uses composition with Resource to implement HATEOAS principles
 * for resource collections, including:
 * - Pagination with standard link relations
 * - Embedded resource management
 * - Collection-specific metadata
 * - Efficient resource grouping
 * 
 * @class Collection
 */
export class Collection {
  #items: Resource[] = [];
  #pagination: PaginationInfo | null = null;
  #collectionName = 'items';
  #resource: Resource;
  
  /**
   * 🎨 Creates a new Collection instance
   * 
   * Initializes a new HATEOAS collection with the provided options. The collection
   * starts empty and can be populated with items, pagination info, and links.
   * 
   * @param {CollectionOptions} options - Configuration options for the collection
   */
  constructor(options: CollectionOptions = {}) {
    this.#resource = new Resource({
      type: options.type || 'collection',
      id: options.id,
      properties: options.properties
    });
    
    if (options.items && Array.isArray(options.items)) {
      this.addItems(options.items);
    }
    this.#pagination = null;
  }

  // Resource delegation methods
  setType(type: string): Collection {
    this.#resource.setType(type);
    return this;
  }

  getType(): string {
    return this.#resource.getType();
  }

  setId(id: string | number): Collection {
    this.#resource.setId(id);
    return this;
  }

  getId(): string {
    return this.#resource.getId();
  }

  setProperty(key: string, value: unknown): void {
    this.#resource.setProperty(key, value);
  }

  getProperty(key: string): unknown {
    return this.#resource.getProperty(key);
  }

  setProperties(properties: Record<string, unknown>): Collection {
    this.#resource.setProperties(properties);
    return this;
  }

  getProperties(): Record<string, unknown> {
    return this.#resource.getProperties();
  }

  addLink(rel: string, href: string, method: string = 'GET'): Collection {
    this.#resource.addLink(rel, href, method);
    return this;
  }

  getLink(rel: string): unknown {
    return this.#resource.getLink(rel);
  }

  getLinks(): Record<string, unknown> {
    return this.#resource.getLinks();
  }

  hasLink(rel: string): boolean {
    return this.#resource.hasLink(rel);
  }

  removeLink(rel: string): Collection {
    this.#resource.removeLink(rel);
    return this;
  }

  setState(state: string): Collection {
    this.#resource.setState(state);
    return this;
  }

  getState(): string {
    return this.#resource.getState();
  }
  
  /**
   * 🏷️ Sets the name used for the embedded collection in JSON representation
   * 
   * The collection name is important in HATEOAS as it helps clients understand
   * the type of resources being collected and their relationships.
   * 
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
   * 📋 Gets the name used for the embedded collection
   * 
   * Returns the collection name, which is used in the JSON representation
   * and helps clients understand the collection's purpose.
   * 
   * @returns {string} The collection name
   */
  getCollectionName(): string {
    return this.#collectionName;
  }
  
  /**
   * ➕ Adds a single resource to the collection
   * 
   * Adds a new resource to the collection, maintaining the HATEOAS principle
   * of resource relationships and enabling clients to discover related
   * resources.
   * 
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
   * ➕ Adds multiple resources to the collection
   * 
   * Efficiently adds multiple resources to the collection, which is useful
   * for bulk operations and initial collection population.
   * 
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
   * 📚 Gets all items in the collection
   * 
   * Returns a copy of all items, ensuring encapsulation and preventing
   * unintended modifications to the collection's contents.
   * 
   * @returns {Resource[]} A copy of the collection's items
   */
  getItems(): Resource[] {
    return [...this.#items];
  }
  
  /**
   * 🔢 Gets the number of items in the collection
   * 
   * Returns the current size of the collection, which is useful for
   * pagination and resource management.
   * 
   * @returns {number} The current number of items
   */
  getCount(): number {
    return this.#items.length;
  }
  
  /**
   * 📊 Sets pagination information for the collection
   * 
   * Pagination is a key feature of HATEOAS collections, enabling efficient
   * navigation through large sets of resources. This method sets up the
   * pagination metadata needed for generating navigation links.
   * 
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
   * 📄 Sets the current page number
   * 
   * Updates the current page number, which is essential for pagination
   * and generating appropriate navigation links.
   * 
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
   * 📏 Sets the number of items per page
   * 
   * Configures the page size, which affects how many resources are
   * included in each page of the collection.
   * 
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
   * 🔢 Sets the total number of items across all pages
   * 
   * Updates the total count, which is crucial for pagination and
   * generating accurate navigation links.
   * 
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
   * 📊 Gets the current pagination information
   * 
   * Returns the current pagination metadata for the collection,
   * which is essential for client-side pagination handling.
   * 
   * @returns {PaginationInfo | null} The current pagination info or null if not set
   */
  getPagination(): PaginationInfo | null {
    return this.#pagination ? { ...this.#pagination } : null;
  }
  
  /**
   * 📚 Gets the total number of pages
   * 
   * Calculates the total number of pages based on the current
   * pagination settings, which is useful for navigation and
   * UI rendering.
   * 
   * @returns {number} The total number of pages
   */
  getTotalPages(): number {
    if (!this.#pagination) return 0;
    return Math.ceil(this.#pagination.total / this.#pagination.pageSize);
  }
  
  /**
   * 🔗 Adds pagination links to the collection
   * 
   * Adds standard HATEOAS pagination links (self, first, next, prev, last)
   * based on the current pagination state. This enables clients to navigate
   * through the collection efficiently.
   * 
   * @param {string} baseUrl - The base URL for pagination links
   * @returns {Collection} The collection instance for method chaining
   */
  addPaginationLinks(baseUrl: string): Collection {
    if (!this.#pagination) {
      return this;
    }

    const { page, pageSize, total } = this.#pagination;
    const totalPages = Math.ceil(total / pageSize);

    // Add self link
    this.addLink('self', `${baseUrl}?page=${page}&pageSize=${pageSize}`);

    // Add first link
    this.addLink('first', `${baseUrl}?page=1&pageSize=${pageSize}`);

    // Add next link if not on last page
    if (page < totalPages) {
      this.addLink('next', `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`);
    }

    // Add prev link if not on first page
    if (page > 1) {
      this.addLink('prev', `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`);
    }

    // Add last link
    this.addLink('last', `${baseUrl}?page=${totalPages}&pageSize=${pageSize}`);

    return this;
  }
  
  /**
   * 🏗️ Creates a new paginated collection
   * 
   * A static factory method for creating a new collection with
   * pagination already set up, which is useful for common
   * collection creation patterns.
   * 
   * @param {Resource[]} items - The initial items
   * @param {number} page - The current page number
   * @param {number} pageSize - Number of items per page
   * @param {number} total - Total number of items
   * @returns {Collection} A new collection with pagination set up
   */
  static paginated(items: Resource[], page: number, pageSize: number, total: number): Collection {
    const collection = new Collection({ items });
    collection.setPagination({ page, pageSize, total });
    return collection;
  }
  
  /**
   * 📦 Converts the collection to a JSON-compatible object
   * 
   * Serializes the collection into a JSON-compatible format that
   * follows HATEOAS principles, including all items, pagination,
   * and links.
   * 
   * @returns {Record<string, unknown>} The JSON representation
   */
  toJSON(): Record<string, unknown> {
    const json = this.#resource.toJSON();
    
    // Add collection-specific properties
    if (this.#items.length > 0) {
      json.embedded = {
        [this.#collectionName]: this.#items.map(item => item.toJSON())
      };
    }
    
    // Add pagination if set
    if (this.#pagination) {
      json.pagination = { ...this.#pagination };
    }
    
    return json;
  }
  
  /**
   * 🔄 Sorts the collection items
   * 
   * Sorts the collection items using the provided comparison function,
   * which is useful for organizing resources in a specific order.
   * 
   * @param {Function} compareFn - The comparison function
   * @returns {Collection} The collection instance for method chaining
   */
  sort(compareFn: (a: Resource, b: Resource) => number): Collection {
    this.#items.sort(compareFn);
    return this;
  }
  
  /**
   * 🔍 Filters the collection items
   * 
   * Returns a new array containing only the items that match the
   * provided predicate function, which is useful for searching
   * and filtering resources.
   * 
   * @param {Function} predicate - The filter function
   * @returns {Resource[]} The filtered items
   */
  filter(predicate: (item: Resource) => boolean): Resource[] {
    return this.#items.filter(predicate);
  }
} 