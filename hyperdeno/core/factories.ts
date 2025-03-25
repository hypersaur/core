/**
 * 🏭 Factory functions for creating HATEOAS resources and collections
 * 
 * This module provides simplified factory functions for creating HATEOAS
 * resources and collections with a more declarative API.
 */

import { Resource } from './resource.ts';
import { Collection } from './collection.ts';
import type { ResourceOptions } from './resource.ts';
import type { CollectionOptions, PaginationInfo } from './collection.ts';

/**
 * 🔧 Options for creating a resource with a simplified API
 * 
 * @interface CreateResourceOptions
 * @extends {ResourceOptions}
 * @property {Record<string, string>} [links] - Map of link relations to URLs
 * @property {string} [state] - Initial state of the resource
 */
export interface CreateResourceOptions extends ResourceOptions {
  links?: Record<string, string>;
  state?: string;
}

/**
 * 🔧 Options for creating a collection with a simplified API
 * 
 * @interface CreateCollectionOptions
 * @extends {CollectionOptions}
 * @property {Record<string, string>} [links] - Map of link relations to URLs
 * @property {PaginationInfo} [pagination] - Pagination information
 * @property {string} [collectionName] - Name used for the embedded collection
 */
export interface CreateCollectionOptions extends CollectionOptions {
  links?: Record<string, string>;
  pagination?: PaginationInfo;
  collectionName?: string;
}

/**
 * 🏗️ Creates a new HATEOAS resource with a simplified API
 * 
 * This factory function provides a more declarative way to create resources
 * by allowing all properties, links, and state to be specified in a single
 * options object.
 * 
 * @example
 * ```typescript
 * const user = createResource({
 *   type: 'user',
 *   id: '123',
 *   properties: { name: 'John' },
 *   links: { self: '/users/123' },
 *   state: 'active'
 * });
 * ```
 * 
 * @param {CreateResourceOptions} options - Resource creation options
 * @returns {Resource} A new resource instance
 */
export function createResource(options: CreateResourceOptions = {}): Resource {
  const resource = new Resource({
    type: options.type,
    id: options.id,
    properties: options.properties
  });

  // Add links if provided
  if (options.links) {
    Object.entries(options.links).forEach(([rel, href]) => {
      resource.addLink(rel, href);
    });
  }

  // Set state if provided
  if (options.state) {
    resource.setState(options.state);
  }

  return resource;
}

/**
 * 🏗️ Creates a new HATEOAS collection with a simplified API
 * 
 * This factory function provides a more declarative way to create collections
 * by allowing all properties, links, pagination, and items to be specified
 * in a single options object.
 * 
 * @example
 * ```typescript
 * const users = createCollection({
 *   type: 'users',
 *   items: [user1, user2],
 *   links: { self: '/users' },
 *   pagination: { page: 1, pageSize: 10, total: 100 },
 *   collectionName: 'users'
 * });
 * ```
 * 
 * @param {CreateCollectionOptions} options - Collection creation options
 * @returns {Collection} A new collection instance
 */
export function createCollection(options: CreateCollectionOptions = {}): Collection {
  const collection = new Collection({
    type: options.type,
    id: options.id,
    properties: options.properties,
    items: options.items
  });

  // Add links if provided
  if (options.links) {
    Object.entries(options.links).forEach(([rel, href]) => {
      collection.addLink(rel, href);
    });
  }

  // Set pagination if provided
  if (options.pagination) {
    collection.setPagination(options.pagination);
  }

  // Set collection name if provided
  if (options.collectionName) {
    collection.setCollectionName(options.collectionName);
  }

  return collection;
} 