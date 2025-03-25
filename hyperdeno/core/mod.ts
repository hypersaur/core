/**
 * Core Module - HATEOAS Resources and Components
 * 
 * @module
 */

export { Resource } from "./resource.ts";
export { Collection } from "./collection.ts";
export { LinkManager, STANDARD_RELS } from "./link.ts";
export { ResourceState } from "./state.ts";
export * from "./errors.ts";
export { ResourceService } from "./service.ts";

// Types
export type { ResourceOptions } from "./resource.ts";
export type { CollectionOptions, PaginationInfo } from "./collection.ts";
export type { Link, LinkObject, LinkOptions } from "./link.ts";
export type { StateTransition } from "./state.ts";
export type { Repository } from "./service.ts"; 