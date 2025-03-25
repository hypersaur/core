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
 * const users = new Collection({
 *   type: 'users',
 *   items: [user1, user2, user3],
 *   pagination: {
 *     page: 1,
 *     pageSize: 10,
 *     total: 100
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
 * @property {PaginationInfo} [pagination] - Pagination information for the collection
 */
export interface CollectionOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  items?: Resource[];
  pagination?: PaginationInfo;
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

    if (options.pagination) {
      this.#pagination = options.pagination;
    }
  }

  /**
   * ➕ Adds a single item to the collection
   * 
   * @param {Resource} item - The resource to add
   * @throws {InvalidArgumentError} If item is not a Resource instance
   * @returns {Collection} The collection instance for method chaining
   */
  addItem(item: Resource): Collection {
    if (!(item instanceof Resource)) {
      throw new InvalidArgumentError('Collection items must be Resource instances');
    }
    this.#items.push(item);
    return this;
  }

  /**
   * ➕ Adds multiple items to the collection
   * 
   * @param {Resource[]} items - Array of resources to add
   * @throws {InvalidArgumentError} If any item is not a Resource instance
   * @returns {Collection} The collection instance for method chaining
   */
  addItems(items: Resource[]): Collection {
    if (!Array.isArray(items)) {
      throw new InvalidArgumentError('Items must be an array');
    }
    
    items.forEach(item => {
      if (!(item instanceof Resource)) {
        throw new InvalidArgumentError('Collection items must be Resource instances');
      }
      this.#items.push(item);
    });
    
    return this;
  }

  /**
   * 📋 Gets all items in the collection
   * 
   * @returns {Resource[]} Array of resources in the collection
   */
  getItems(): Resource[] {
    return [...this.#items];
  }

  /**
   * 🔢 Gets the number of items in the collection
   * 
   * @returns {number} The number of items
   */
  getCount(): number {
    return this.#items.length;
  }

  /**
   * 🔄 Sorts the collection items
   * 
   * @param {Function} compareFn - Comparison function for sorting
   * @returns {Collection} The sorted collection
   */
  sort(compareFn: (a: Resource, b: Resource) => number): Collection {
    this.#items.sort(compareFn);
    return this;
  }

  /**
   * 🔍 Filters the collection items
   * 
   * @param {Function} predicate - Filter predicate function
   * @returns {Resource[]} Filtered array of resources
   */
  filter(predicate: (item: Resource) => boolean): Resource[] {
    return this.#items.filter(predicate);
  }

  /**
   * 📦 Converts the collection to a JSON representation
   * 
   * @returns {Record<string, unknown>} JSON representation of the collection
   */
  toJSON(): Record<string, unknown> {
    const json = this.#resource.toJSON();
    
    // Add items as embedded resources
    json.embedded = {
      items: this.#items.map(item => item.toJSON())
    };
    
    if (this.#pagination) {
      json.pagination = this.#pagination;
    }
    
    return json;
  }
} 