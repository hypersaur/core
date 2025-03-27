/**
 * Resource Registry
 * Registry for resource types and their schemas
 */

import { Resource } from './resource.ts';
import { ValidationError } from '../../infrastructure/errors/domain-errors.ts';

/**
 * Schema field definition interface
 */
export interface SchemaField {
  type: string;
  required?: boolean;
  default?: unknown;
  validate?: (value: unknown) => boolean;
}

/**
 * Resource schema definition interface
 */
export interface ResourceSchema {
  fields: Record<string, SchemaField>;
}

/**
 * Resource route handlers interface
 */
export interface ResourceRoutes {
  base: string;
  list?: (req: Request) => Promise<unknown[]>;
  get?: (req: Request, id: string) => Promise<unknown>;
  create?: (req: Request, data: unknown) => Promise<unknown>;
  update?: (req: Request, id: string, data: unknown) => Promise<unknown>;
  delete?: (req: Request, id: string) => Promise<void>;
}

/**
 * Resource definition options interface
 */
export interface ResourceDefinition {
  schema: ResourceSchema;
  routes: ResourceRoutes;
  transform?: (data: unknown) => unknown;
}

/**
 * Resource Registry class
 */
export class ResourceRegistry {
  private definitions = new Map<string, ResourceDefinition>();

  /**
   * Define a new resource type
   */
  define(type: string, definition: ResourceDefinition): void {
    if (!type || typeof type !== "string") {
      throw new Error("Resource type must be a non-empty string");
    }

    if (!definition.schema || !definition.routes) {
      throw new Error("Resource definition must include schema and routes");
    }

    this.definitions.set(type, definition);
  }

  /**
   * Get a resource definition
   */
  get(type: string): ResourceDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Get all resource definitions
   */
  getAll(): Map<string, ResourceDefinition> {
    return new Map(this.definitions);
  }

  /**
   * Validate data against a schema
   */
  validateSchema(data: unknown, schema: ResourceSchema): boolean {
    if (!data || typeof data !== "object") {
      return false;
    }

    for (const [field, definition] of Object.entries(schema.fields)) {
      const value = (data as Record<string, unknown>)[field];
      
      // Check required fields
      if (definition.required && value === undefined) {
        return false;
      }

      // Skip validation for optional undefined fields
      if (value === undefined) {
        continue;
      }

      // Type validation
      switch (definition.type) {
        case "string":
          if (typeof value !== "string") return false;
          break;
        case "number":
          if (typeof value !== "number") return false;
          break;
        case "boolean":
          if (typeof value !== "boolean") return false;
          break;
        case "array":
          if (!Array.isArray(value)) return false;
          break;
        case "object":
          if (typeof value !== "object" || value === null) return false;
          break;
        default:
          // Custom type validation
          if (definition.validate && !definition.validate(value)) {
            return false;
          }
      }
    }

    return true;
  }

  /**
   * Transform data according to schema defaults
   */
  transformData(data: unknown, schema: ResourceSchema): unknown {
    if (!data || typeof data !== "object") {
      return data;
    }

    const result = { ...(data as Record<string, unknown>) };

    for (const [field, definition] of Object.entries(schema.fields)) {
      if (result[field] === undefined && definition.default !== undefined) {
        result[field] = definition.default;
      }
    }

    return result;
  }
} 