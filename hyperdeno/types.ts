/**
 * Type definitions for HyperDeno
 * 
 * This file centralizes and re-exports all types from the library
 * for easier usage by consumers.
 * 
 * @module
 */

// Resource types
export type { ResourceOptions } from "./core/resource.ts";
export type { CollectionOptions, PaginationInfo } from "./core/collection.ts";
export type { Link, LinkObject, LinkOptions } from "./core/link.ts";
export type { StateTransition } from "./core/state.ts";
export type { Repository } from "./core/service.ts";

// HTTP types
export type { RouteHandler, ResourceHandlers, HttpMethod } from "./http/router.ts";
export type { PathParams, QueryParams } from "./http/request.ts";
export type { ResponseOptions } from "./http/response.ts";
export type { MediaType, Format } from "./http/content-type.ts";

// Validation types
export type { ValidationRule, ValidationSchema } from "./util/validation.ts";

// Context types
export interface ResourceContext {
  params: Record<string, string>;
  query: Record<string, string>;
  request: Request;
  url: URL;
  headers: Headers;
  method: string;
} 