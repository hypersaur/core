/**
 * 📝 Resource Definition System
 * 
 * This module provides a simplified way to define HATEOAS resources with
 * built-in schema validation and automatic route generation.
 */

import { createResource, createCollection } from "./factories.ts";
import { Router } from "../http/router.ts";
import { InvalidArgumentError } from "./errors.ts";
import { createJsonResponse } from "../http/response.ts";

/**
 * 🔧 Schema field definition
 * 
 * @interface SchemaField
 * @property {string} type - The type of the field (string, number, boolean, etc.)
 * @property {boolean} [required] - Whether the field is required
 * @property {unknown} [default] - Default value for the field
 * @property {Function} [validate] - Custom validation function
 */
export interface SchemaField {
  type: string;
  required?: boolean;
  default?: unknown;
  validate?: (value: unknown) => boolean;
}

/**
 * 🔧 Resource schema definition
 * 
 * @interface ResourceSchema
 * @property {Record<string, SchemaField>} fields - Field definitions
 */
export interface ResourceSchema {
  fields: Record<string, SchemaField>;
}

/**
 * 🔧 Resource route handlers
 * 
 * @interface ResourceRoutes
 * @property {string} base - Base URL for the resource
 * @property {Function} [list] - Handler for listing resources
 * @property {Function} [get] - Handler for getting a single resource
 * @property {Function} [create] - Handler for creating a resource
 * @property {Function} [update] - Handler for updating a resource
 * @property {Function} [delete] - Handler for deleting a resource
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
 * 🔧 Resource definition options
 * 
 * @interface ResourceDefinition
 * @property {ResourceSchema} schema - Resource schema definition
 * @property {ResourceRoutes} routes - Route handlers
 * @property {Function} [transform] - Transform function for resource data
 */
export interface ResourceDefinition {
  schema: ResourceSchema;
  routes: ResourceRoutes;
  transform?: (data: unknown) => unknown;
}

/**
 * 📚 Resource definitions registry
 */
const resourceDefinitions = new Map<string, ResourceDefinition>();

/**
 * 🏗️ Defines a new resource type
 * 
 * @param {string} type - The resource type name
 * @param {ResourceDefinition} definition - Resource definition
 */
export function defineResource(type: string, definition: ResourceDefinition): void {
  if (!type || typeof type !== "string") {
    throw new InvalidArgumentError("Resource type must be a non-empty string");
  }

  if (!definition.schema || !definition.routes) {
    throw new InvalidArgumentError("Resource definition must include schema and routes");
  }

  resourceDefinitions.set(type, definition);
}

/**
 * 🔍 Gets a resource definition
 * 
 * @param {string} type - The resource type name
 * @returns {ResourceDefinition | undefined} The resource definition
 */
export function getResourceDefinition(type: string): ResourceDefinition | undefined {
  return resourceDefinitions.get(type);
}

/**
 * ✅ Validates data against a schema
 * 
 * @param {unknown} data - The data to validate
 * @param {ResourceSchema} schema - The schema to validate against
 * @returns {boolean} Whether the data is valid
 */
function validateSchema(data: unknown, schema: ResourceSchema): boolean {
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
        if (typeof value !== "object") return false;
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
 * 🔄 Transforms data according to schema defaults
 * 
 * @param {unknown} data - The data to transform
 * @param {ResourceSchema} schema - The schema with defaults
 * @returns {unknown} The transformed data
 */
function transformData(data: unknown, schema: ResourceSchema): unknown {
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

/**
 * 🛣️ Registers resource routes
 * 
 * @param {Router} router - The router to register routes on
 */
export function registerResourceRoutes(router: Router): void {
  for (const [type, definition] of resourceDefinitions) {
    const { routes, schema, transform } = definition;

    // List route
    if (routes.list) {
      const listHandler = routes.list;
      router.get(routes.base, async (req: Request, params: Record<string, string>) => {
        const items = await listHandler(req);
        const collection = createCollection({
          type,
          items: items.map(item => createResource({
            type,
            properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
          })),
          collectionName: type
        });
        return createJsonResponse(collection);
      });
    }

    // Get route
    if (routes.get) {
      const getHandler = routes.get;
      router.get(`${routes.base}/:id`, async (req: Request, params: Record<string, string>) => {
        const item = await getHandler(req, params.id);
        const resource = createResource({
          type,
          id: params.id,
          properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
        });
        return createJsonResponse(resource);
      });
    }

    // Create route
    if (routes.create) {
      const createHandler = routes.create;
      router.post(routes.base, async (req: Request, params: Record<string, string>) => {
        const data = await req.json();
        
        if (!validateSchema(data, schema)) {
          throw new InvalidArgumentError("Invalid resource data");
        }

        const transformedData = transformData(data, schema);
        const item = await createHandler(req, transformedData);
        
        const resource = createResource({
          type,
          properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
        });
        return createJsonResponse(resource, { status: 201 });
      });
    }

    // Update route
    if (routes.update) {
      const updateHandler = routes.update;
      router.put(`${routes.base}/:id`, async (req: Request, params: Record<string, string>) => {
        const data = await req.json();
        
        if (!validateSchema(data, schema)) {
          throw new InvalidArgumentError("Invalid resource data");
        }

        const transformedData = transformData(data, schema);
        const item = await updateHandler(req, params.id, transformedData);
        
        const resource = createResource({
          type,
          id: params.id,
          properties: transform ? transform(item) as Record<string, unknown> : item as Record<string, unknown>
        });
        return createJsonResponse(resource);
      });
    }

    // Delete route
    if (routes.delete) {
      const deleteHandler = routes.delete;
      router.delete(`${routes.base}/:id`, async (req: Request, params: Record<string, string>) => {
        await deleteHandler(req, params.id);
        return createJsonResponse(null, { status: 204 });
      });
    }
  }
} 