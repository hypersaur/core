import type { Resource } from './resource.ts';
import { Collection } from './collection.ts';

/**
 * Base interface for repository operations
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: T): Promise<T>;
  update(id: string, data: T): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Base service class that implements the resource service pipeline
 * 
 * This class provides a foundation for implementing the pipeline:
 * DB => Repository => ResourceService => Hal-JSON -> HTML
 */
export abstract class ResourceService<T> {
  constructor(protected repository: Repository<T>) {}

  /**
   * Convert a domain entity to a HAL resource
   * @param entity The domain entity to convert
   * @param baseUrl The base URL for generating links
   * @returns A HAL resource
   */
  protected abstract toResource(entity: T, baseUrl: string): Resource;

  /**
   * Convert a HAL resource to a domain entity
   * @param resource The HAL resource to convert
   * @returns A domain entity
   */
  protected abstract toEntity(resource: Resource): T;

  /**
   * Get a single resource by ID
   * @param id The resource ID
   * @param baseUrl The base URL for generating links
   * @returns A HAL resource or null if not found
   */
  async getResource(id: string, baseUrl: string): Promise<Resource | null> {
    const entity = await this.repository.findById(id);
    if (!entity) return null;
    return this.toResource(entity, baseUrl);
  }

  /**
   * Get all resources
   * @param baseUrl The base URL for generating links
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
   * Create a new resource
   * @param resource The HAL resource to create
   * @param baseUrl The base URL for generating links
   * @returns The created HAL resource
   */
  async createResource(resource: Resource, baseUrl: string): Promise<Resource> {
    const entity = this.toEntity(resource);
    const created = await this.repository.create(entity);
    return this.toResource(created, baseUrl);
  }

  /**
   * Update an existing resource
   * @param id The resource ID
   * @param resource The HAL resource with updates
   * @param baseUrl The base URL for generating links
   * @returns The updated HAL resource
   */
  async updateResource(id: string, resource: Resource, baseUrl: string): Promise<Resource> {
    const entity = this.toEntity(resource);
    const updated = await this.repository.update(id, entity);
    return this.toResource(updated, baseUrl);
  }

  /**
   * Delete a resource
   * @param id The resource ID
   */
  async deleteResource(id: string): Promise<void> {
    await this.repository.delete(id);
  }
} 