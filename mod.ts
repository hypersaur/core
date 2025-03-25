/**
 * HyperDeno - A HATEOAS API Framework for Deno
 * 
 * This is the main entry point for the HyperDeno framework.
 * It re-exports all the public API components.
 * 
 * @module
 */

// Core components
export { Resource } from "./hyperdeno/core/resource.ts";
export { Collection } from "./hyperdeno/core/collection.ts";
export { LinkManager, STANDARD_RELS } from "./hyperdeno/core/link.ts";
export { ResourceState } from "./hyperdeno/core/state.ts";
export { ApiError, ValidationError, NotFoundError } from "./hyperdeno/core/errors.ts";
export { ResourceService } from "./hyperdeno/core/service.ts";

// HTTP components
export { Router, HTTP_METHODS } from "./hyperdeno/http/router.ts";
export * from "./hyperdeno/http/request.ts";
export { createErrorResponse } from "./hyperdeno/http/response.ts";
export * from "./hyperdeno/http/content-type.ts";

// Rendering components
export { Renderer } from "./hyperdeno/rendering/renderer.ts";
export { RendererFactory } from "./hyperdeno/rendering/renderer_factory.ts";
export { HalRenderer } from "./hyperdeno/rendering/hal_renderer.ts";
export { HtmlRenderer } from "./hyperdeno/rendering/html_renderer.ts";

// Utility components
export * from "./hyperdeno/util/validation.ts";

// Server
export { Server } from "./hyperdeno/server.ts";

// Convenience factory functions
export { createApp, createServer } from "./hyperdeno/index.ts";

// Type exports
export type {
  ResourceOptions,
  LinkOptions,
  Link,
  LinkObject,
  StateTransition,
  PaginationInfo,
  CollectionOptions,
  Repository,
  ValidationRule,
  ValidationSchema,
  ResourceContext
} from "./hyperdeno/types.ts"; 