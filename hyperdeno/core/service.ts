/**
 * 🏗️ Service Layer for HATEOAS Resources
 * 
 * This module implements the service layer for HATEOAS resources, providing
 * a clean abstraction between domain entities and HATEOAS resources. It
 * follows the repository pattern and implements the resource service pipeline:
 * 
 * Database => Repository => ResourceService => HAL-JSON => HTML
 * 
 * Key HATEOAS features:
 * - Resource transformation pipeline
 * - Hypermedia-driven state management
 * - Self-descriptive messages
 * - Stateless interactions
 * 
 * @example
 * ```typescript
 * class UserService extends ResourceService<User> {
 *   protected toResource(user: User, baseUrl: string): Resource {
 *     return new Resource()
 *       .setType('user')
 *       .setId(user.id)
 *       .setProperties(user)
 *       .addLink('self', `${baseUrl}/users/${user.id}`);
 *   }
 * }
 * ```
 */

import type { Resource } from './resource.ts';
import { Collection } from './collection.ts';

/**
 * 📚 Base interface for repository operations
 * 
 * Defines the standard CRUD operations for data persistence, which are
 * essential for maintaining resource state in a HATEOAS architecture.
 * 
 * @interface Repository
 * @template T - The type of domain entity
 */
export interface Repository<T> {
  /**
   * 🔍 Find an entity by its ID
   * @param id - The unique identifier
   * @returns The entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * 📋 Find all entities
   * @returns Array of all entities
   */
  findAll(): Promise<T[]>;

  /**
   * ➕ Create a new entity
   * @param data - The entity data
   * @returns The created entity
   */
  create(data: T): Promise<T>;

  /**
   * 🔄 Update an existing entity
   * @param id - The entity ID
   * @param data - The updated data
   * @returns The updated entity
   */
  update(id: string, data: T): Promise<T>;

  /**
   * ❌ Delete an entity
   * @param id - The entity ID
   */
  delete(id: string): Promise<void>;
}

/**
 * 🎯 Base service class that implements the resource service pipeline
 * 
 * This abstract class provides the foundation for implementing HATEOAS
 * resource services. It handles the transformation between domain entities
 * and HATEOAS resources, ensuring proper hypermedia controls and state
 * management.
 * 
 * @class ResourceService
 * @template T - The type of domain entity
 */
export abstract class ResourceService<T> {
  /**
   * 🎨 Creates a new resource service
   * 
   * @param repository - The repository for data persistence
   */
  constructor(protected repository: Repository<T>) {}

  /**
   * 🔄 Convert a domain entity to a HAL resource
   * 
   * This method is responsible for transforming domain entities into
   * HATEOAS resources, adding appropriate hypermedia controls and
   * ensuring self-descriptive messages.
   * 
   * @param entity - The domain entity to convert
   * @param baseUrl - The base URL for generating links
   * @returns A HAL resource with hypermedia controls
   */
  protected abstract toResource(entity: T, baseUrl: string): Resource;

  /**
   * 🔄 Convert a HAL resource to a domain entity
   * 
   * This method handles the reverse transformation, extracting the
   * domain-specific data from a HATEOAS resource.
   * 
   * @param resource - The HAL resource to convert
   * @returns A domain entity
   */
  protected abstract toEntity(resource: Resource): T;

  /**
   * 🔍 Get a single resource by ID
   * 
   * Retrieves a resource and ensures it has proper hypermedia controls
   * for state transitions and related resources.
   * 
   * @param id - The resource ID
   * @param baseUrl - The base URL for generating links
   * @returns A HAL resource or null if not found
   */
  async getResource(id: string, baseUrl: string): Promise<Resource | null> {
    const entity = await this.repository.findById(id);
    if (!entity) return null;
    return this.toResource(entity, baseUrl);
  }

  /**
   * 📋 Get all resources
   * 
   * Retrieves a collection of resources with appropriate hypermedia
   * controls for pagination and navigation.
   * 
   * @param baseUrl - The base URL for generating links
   * @returns A collection of HAL resources
   */
  async getResources(baseUrl: string): Promise<Collection> {
    const entities = await this.repository.findAll();
    const resources = entities.map(entity => this.toResource(entity, baseUrl));
    
    const collection = new Collection();
    collection.addItems(resources);
    collection.addLink('self', `${baseUrl}/resources`);
    
    return collection;
  }

  /**
   * ➕ Create a new resource
   * 
   * Creates a new resource and ensures it has proper hypermedia controls
   * for subsequent state transitions.
   * 
   * @param resource - The HAL resource to create
   * @param baseUrl - The base URL for generating links
   * @returns The created HAL resource
   */
  async createResource(resource: Resource, baseUrl: string): Promise<Resource> {
    const entity = this.toEntity(resource);
    const created = await this.repository.create(entity);
    return this.toResource(created, baseUrl);
  }

  /**
   * 🔄 Update an existing resource
   * 
   * Updates a resource while maintaining its hypermedia controls and
   * ensuring proper state transitions.
   * 
   * @param id - The resource ID
   * @param resource - The HAL resource with updates
   * @param baseUrl - The base URL for generating links
   * @returns The updated HAL resource
   */
  async updateResource(id: string, resource: Resource, baseUrl: string): Promise<Resource> {
    const entity = this.toEntity(resource);
    const updated = await this.repository.update(id, entity);
    return this.toResource(updated, baseUrl);
  }

  /**
   * ❌ Delete a resource
   * 
   * Removes a resource and its associated hypermedia controls.
   * 
   * @param id - The resource ID
   */
  async deleteResource(id: string): Promise<void> {
    await this.repository.delete(id);
  }
} 