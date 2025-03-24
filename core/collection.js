/**
 * Collection class for HATEOAS Resources
 * 
 * Represents a collection of resources with pagination support.
 * Extends Resource to inherit link management and other basic functionality.
 */

import { Resource } from './resource.js';
import { InvalidArgumentError } from './errors.js';

/**
 * @typedef {Object} PaginationInfo
 * @property {number} page - Current page number (1-based)
 * @property {number} pageSize - Number of items per page
 * @property {number} total - Total number of items across all pages
 */

/**
 * @typedef {Object} CollectionOptions
 * @property {string} [type] - Collection type
 * @property {string} [id] - Collection ID
 * @property {Object} [properties] - Collection properties
 * @property {Resource[]} [items] - Initial items
 */

class Collection extends Resource {
  #items = [];
  #pagination = null;
  #collectionName = 'items';
  
  /**
   * Create a new collection
   * @param {CollectionOptions} [options] - Collection options
   */
  constructor(options = {}) {
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
   * @param {string} name - Collection name
   * @returns {Collection} For chaining
   */
  setCollectionName(name) {
    if (typeof name !== 'string' || !name) {
      throw new InvalidArgumentError('Collection name must be a non-empty string');
    }
    
    this.#collectionName = name;
    return this;
  }
  
  /**
   * Get the collection name
   * @returns {string} Collection name
   */
  getCollectionName() {
    return this.#collectionName;
  }
  
  /**
   * Add an item to the collection
   * @param {Resource} item - Resource to add
   * @returns {Collection} For chaining
   */
  addItem(item) {
    if (!(item instanceof Resource)) {
      throw new InvalidArgumentError('Item must be a Resource instance');
    }
    
    this.#items.push(item);
    return this;
  }
  
  /**
   * Add multiple items to the collection
   * @param {Resource[]} items - Resources to add
   * @returns {Collection} For chaining
   */
  addItems(items) {
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
   * @returns {Resource[]} Collection items
   */
  getItems() {
    return [...this.#items];
  }
  
  /**
   * Get the number of items in the collection
   * @returns {number} Item count
   */
  getCount() {
    return this.#items.length;
  }
  
  /**
   * Set pagination information
   * @param {PaginationInfo} pagination - Pagination info
   * @returns {Collection} For chaining
   */
  setPagination(pagination) {
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
   * @param {number} page - Page number (1-based)
   * @returns {Collection} For chaining
   */
  setPage(page) {
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
   * @param {number} pageSize - Items per page
   * @returns {Collection} For chaining
   */
  setPageSize(pageSize) {
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
   * @param {number} total - Total item count
   * @returns {Collection} For chaining
   */
  setTotal(total) {
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
   * @returns {PaginationInfo|null} Pagination info or null if not set
   */
  getPagination() {
    return this.#pagination ? { ...this.#pagination } : null;
  }
  
  /**
   * Calculate the total number of pages based on pagination
   * @returns {number} Total pages or 0 if pagination not set
   */
  getTotalPages() {
    if (!this.#pagination) return 0;
    
    const { total, pageSize } = this.#pagination;
    if (total === 0) return 0;
    
    return Math.ceil(total / pageSize);
  }
  
  /**
   * Add pagination links to the collection
   * @param {string} baseUrl - Base URL for pagination links
   * @returns {Collection} For chaining
   */
  addPaginationLinks(baseUrl) {
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
    
    // Previous page
    if (page > 1) {
      this.addLink('prev', `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`);
    }
    
    // Next page
    if (page < totalPages) {
      this.addLink('next', `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`);
    }
    
    return this;
  }
  
  /**
   * Create a paginated collection
   * @param {Resource[]} items - Items for the current page
   * @param {number} page - Current page number (1-based)
   * @param {number} pageSize - Items per page
   * @param {number} total - Total items across all pages
   * @returns {Collection} A new Collection with pagination
   */
  static paginated(items, page, pageSize, total) {
    return new Collection()
      .addItems(items)
      .setPage(page)
      .setPageSize(pageSize)
      .setTotal(total);
  }
  
  /**
   * Convert the collection to a JSON object
   * This is called automatically by JSON.stringify()
   * @returns {Object} JSON representation of the collection
   */
  toJSON() {
    // Get the base JSON from Resource class
    const json = super.toJSON();
    
    // Add pagination information
    if (this.#pagination) {
      json._pagination = { ...this.#pagination };
    }
    
    // Ensure embedded items are present
    if (!json._embedded) {
      json._embedded = {};
    }
    
    // Add items to embedded section with proper collection name
    json._embedded[this.#collectionName] = this.#items.map(item => item.toJSON());
    
    return json;
  }
}

export { Collection };