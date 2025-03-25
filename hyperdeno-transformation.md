# HyperDeno Transformation Guide

This document outlines the steps needed to transform HyperDeno into a JSR (Deno's package registry) package for Deno 2. Follow these steps in order to convert your existing codebase into a modular, reusable library.

## 1. Package Configuration

### Create/Update deno.json

```json
{
  "name": "@yourusername/hyperdeno",
  "version": "1.0.0",
  "exports": {
    ".": "./mod.ts",
    "./core": "./hyperdeno/core/mod.ts",
    "./http": "./hyperdeno/http/mod.ts",
    "./rendering": "./hyperdeno/rendering/mod.ts",
    "./util": "./hyperdeno/util/mod.ts"
  },
  "tasks": {
    "dev": "deno run --watch examples/basic-server.ts",
    "test": "deno test",
    "check": "deno check mod.ts",
    "lint": "deno lint"
  },
  "fmt": {
    "indentWidth": 2,
    "singleQuote": true,
    "semiColons": true
  },
  "imports": {
    "@std/http": "jsr:@std/http@^1.0.0",
    "@std/assert": "jsr:@std/assert@^1.0.0"
  },
  "publish": {
    "exclude": ["tests/", "examples/", ".github/", "scripts/"]
  }
}
```

## 2. Create Main Entry Point

### Create mod.ts in the root directory

```typescript
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
export * from "./hyperdeno/core/errors.ts";
export { ResourceService } from "./hyperdeno/core/service.ts";

// HTTP components
export { Router, HTTP_METHODS } from "./hyperdeno/http/router.ts";
export * from "./hyperdeno/http/request.ts";
export * from "./hyperdeno/http/response.ts";
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
```

## 3. Create Module Entry Points

### Create hyperdeno/core/mod.ts

```typescript
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
```

### Create hyperdeno/http/mod.ts

```typescript
/**
 * HTTP Module - Routing and HTTP Components
 * 
 * @module
 */

export { Router, HTTP_METHODS } from "./router.ts";
export * from "./request.ts";
export * from "./response.ts";
export * from "./content-type.ts";

// Types
export type { RouteHandler, ResourceHandlers, HttpMethod } from "./router.ts";
export type { PathParams, QueryParams, ValidationRule, ValidationSchema } from "./request.ts";
export type { ResponseOptions } from "./response.ts";
export type { MediaType, Format } from "./content-type.ts";
```

### Create hyperdeno/rendering/mod.ts

```typescript
/**
 * Rendering Module - Content Renderers
 * 
 * @module
 */

export { Renderer } from "./renderer.ts";
export { RendererFactory } from "./renderer_factory.ts";
export { HalRenderer } from "./hal_renderer.ts";
export { HtmlRenderer } from "./html_renderer.ts";

// Types
export type { RendererOptions } from "./renderer.ts";
export type { RendererFactoryOptions } from "./renderer_factory.ts";
```

### Create hyperdeno/util/mod.ts

```typescript
/**
 * Utility Module - Helper Functions
 * 
 * @module
 */

export * from "./validation.ts";

// Types
export type { ValidationRule, ValidationSchema } from "./validation.ts";
```

## 4. Create Centralized Type Definitions

### Create hyperdeno/types.ts

```typescript
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

// Renderer types
export type { RendererOptions } from "./rendering/renderer.ts";
export type { RendererFactoryOptions } from "./rendering/renderer_factory.ts";

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
```

## 5. Update Server Implementation for Deno 2

### Update hyperdeno/server.ts

```typescript
/**
 * Deno 2 compatible server implementation for HyperDeno
 * 
 * This file contains the Deno-specific server implementation, updated to work
 * with Deno 2's improved HTTP handling.
 */

import { Router } from "./http/router.ts";
import { RendererFactory } from "./rendering/renderer_factory.ts";
import { createErrorResponse } from "./http/response.ts";
import { ApiError } from "./core/errors.ts";

export interface ServerOptions {
  port?: number;
  hostname?: string;
  rendererFactory?: RendererFactory;
  signal?: AbortSignal;
  onListen?: (params: { hostname: string; port: number }) => void;
}

export class Server {
  private port: number;
  private hostname: string;
  private abortController: AbortController | null = null;
  private rendererFactory: RendererFactory;
  private router: Router;
  private onListen?: (params: { hostname: string; port: number }) => void;

  /**
   * Creates a new server instance
   * @param {ServerOptions} options - Server configuration options
   */
  constructor(options: ServerOptions = {}) {
    this.port = options.port || 8000;
    this.hostname = options.hostname || "0.0.0.0";
    this.router = new Router();
    this.rendererFactory = options.rendererFactory || new RendererFactory();
    this.onListen = options.onListen;
  }

  /**
   * Starts the server
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    this.abortController = new AbortController();
    
    // Use the Deno.serve API for Deno 2
    try {
      await Deno.serve({
        port: this.port,
        hostname: this.hostname,
        signal: this.abortController.signal,
        onListen: this.onListen,
        handler: (request) => this.handle(request),
      }).finished;
    } catch (error) {
      if (error instanceof Deno.errors.Interrupted) {
        // Server was stopped, no need to handle this as an error
        return;
      }
      throw error;
    }
  }

  /**
   * Handle a request
   * @param request - The request to handle
   * @returns The response
   */
  async handle(request: Request): Promise<Response> {
    try {
      return await this.router.handle(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }
      return createErrorResponse(
        error instanceof Error ? error : new Error("Internal Server Error")
      );
    }
  }

  /**
   * Gets the router instance
   * @returns {Router} The router instance
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Gets the renderer factory instance
   * @returns {RendererFactory} The renderer factory instance
   */
  getRendererFactory(): RendererFactory {
    return this.rendererFactory;
  }

  /**
   * Stop the server
   */
  stop(): void {
    if (!this.abortController) {
      throw new Error("Server is not running");
    }

    this.abortController.abort();
    this.abortController = null;
  }
}
```

## 6. Create App Factory

### Create hyperdeno/app.ts

```typescript
/**
 * HyperDeno Application Factory
 * 
 * Provides a clean, simplified factory for creating HyperDeno applications.
 */

import { Router } from "./http/router.ts";
import { RendererFactory } from "./rendering/renderer_factory.ts";
import { Resource } from "./core/resource.ts";
import { ServerOptions, Server } from "./server.ts";

export interface AppOptions extends ServerOptions {
  rendererFactory?: RendererFactory;
}

export interface HyperApp {
  router: Router;
  rendererFactory: RendererFactory;
  handle: (request: Request) => Promise<Response>;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Create a new HyperDeno application
 * 
 * @example
 * ```typescript
 * // Create app
 * const app = createApp({ port: 3000 });
 * 
 * // Configure routes
 * app.router.get("/api", async () => {
 *   return new Resource()
 *     .setType("api")
 *     .setProperty("name", "My API")
 *     .addLink("self", "/api");
 * });
 * 
 * // Start the server
 * await app.start();
 * ```
 */
export function createApp(options: AppOptions = {}): HyperApp {
  const rendererFactory = options.rendererFactory || new RendererFactory();
  const router = new Router();
  const server = new Server({
    ...options,
    rendererFactory,
  });

  // Set the router on the server
  if (server.getRouter() !== router) {
    // This shouldn't happen with the current implementation,
    // but it's a safety measure in case the Server class changes
    throw new Error("Router mismatch between app and server");
  }

  return {
    router,
    rendererFactory,
    
    handle: async (request: Request): Promise<Response> => {
      const response = await router.handle(request);
      
      // If the response body is a Resource, use the renderer
      if (response.headers.get("Content-Type") === "application/json") {
        try {
          const body = await response.json();
          if (body.type && (body.links || body.properties)) {
            // Looks like a resource, let's create one
            const resource = new Resource({
              type: body.type,
              id: body.id,
              properties: body.properties
            });
            
            // Add links
            if (body.links) {
              for (const [rel, link] of Object.entries(body.links)) {
                if (Array.isArray(link)) {
                  for (const l of link) {
                    resource.addLink(rel, l.href, l.method, {
                      templated: l.templated,
                      title: l.title,
                      type: l.type,
                      hreflang: l.hreflang
                    });
                  }
                } else {
                  resource.addLink(rel, (link as any).href, (link as any).method, {
                    templated: (link as any).templated,
                    title: (link as any).title,
                    type: (link as any).type,
                    hreflang: (link as any).hreflang
                  });
                }
              }
            }
            
            // Use accept header for content negotiation
            const acceptHeader = request.headers.get("accept") || "application/json";
            return rendererFactory.render(resource, acceptHeader);
          }
        } catch {
          // If we can't parse as JSON or it's not a resource, just return the original response
        }
      }
      
      return response;
    },
    
    start: async (): Promise<void> => {
      return server.start();
    },
    
    stop: (): void => {
      server.stop();
    }
  };
}
```

## 7. Create Example

### Create examples/basic-server.ts

```typescript
/**
 * Basic HyperDeno Server Example
 * 
 * This example demonstrates how to create a simple HATEOAS API
 * using the HyperDeno framework.
 */

// Import from the JSR package (in a real app)
// import { createApp, Resource, Collection } from "jsr:@yourusername/hyperdeno";

// For local development, import from the local module
import { createApp, Resource, Collection } from "../mod.ts";

// Create the application
const app = createApp({
  port: 3000,
  hostname: "localhost",
  onListen: ({ hostname, port }) => {
    console.log(`🚀 Server running at http://${hostname}:${port}/`);
  },
});

// Set up the API root
app.router.get("/api", async (request) => {
  const resource = new Resource({
    type: "api",
    properties: {
      name: "HyperDeno Example API",
      version: "1.0.0",
      description: "A simple HATEOAS API built with HyperDeno"
    }
  });
  
  // Add links to available resources
  resource.addLink("self", "/api");
  resource.addLink("users", "/api/users");
  resource.addLink("posts", "/api/posts");
  
  return resource;
});

// Set up a collection resource
app.router.get("/api/users", async (request) => {
  // Simulate a database
  const users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
    { id: "3", name: "Charlie", email: "charlie@example.com" }
  ];
  
  // Create user resources
  const userResources = users.map(user => {
    const resource = new Resource({
      type: "user",
      id: user.id,
      properties: {
        name: user.name,
        email: user.email
      }
    });
    
    // Add links to each user
    resource.addLink("self", `/api/users/${user.id}`);
    resource.addLink("posts", `/api/users/${user.id}/posts`);
    
    return resource;
  });
  
  // Create the collection
  const collection = new Collection({
    type: "users",
    items: userResources
  });
  
  // Add collection links
  collection.addLink("self", "/api/users");
  collection.addLink("api", "/api");
  
  // Add pagination
  collection.setPagination({
    page: 1,
    pageSize: 10,
    total: users.length
  });
  
  collection.addPaginationLinks("/api/users");
  
  return collection;
});

// Set up an individual resource
app.router.get("/api/users/:id", async (request, params) => {
  const userId = params.id;
  
  // Simulate database lookup
  const users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
    { id: "3", name: "Charlie", email: "charlie@example.com" }
  ];
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return new Response(JSON.stringify({ 
      error: "User not found" 
    }), { 
      status: 404, 
      headers: { "Content-Type": "application/json" } 
    });
  }
  
  // Create user resource
  const resource = new Resource({
    type: "user",
    id: user.id,
    properties: {
      name: user.name,
      email: user.email
    }
  });
  
  // Add links
  resource.addLink("self", `/api/users/${user.id}`);
  resource.addLink("collection", "/api/users");
  resource.addLink("posts", `/api/users/${user.id}/posts`);
  resource.addLink("edit", `/api/users/${user.id}`, "PUT");
  resource.addLink("delete", `/api/users/${user.id}`, "DELETE");
  
  return resource;
});

// Start the server
await app.start();
```

## 8. Create README.md

```markdown
# HyperDeno

A HATEOAS (Hypermedia as the Engine of Application State) framework for building hypermedia-driven APIs using Deno 2.

## Features

- **Pure Web Standards**: Built on web standard Request/Response objects
- **HATEOAS Resources**: First-class support for hypermedia resources and links
- **Content Negotiation**: Support for multiple content types (JSON, HAL, HTML)
- **State Transitions**: Built-in support for state machines and transitions
- **Validation**: Simple yet powerful validation system
- **Modular Design**: Clean separation of concerns for easy customization

## Installation

```ts
// Import from JSR
import { createApp, Resource } from "jsr:@yourusername/hyperdeno";

// Or use a specific version
import { createApp, Resource } from "jsr:@yourusername/hyperdeno@1.0.0";

// Import specific submodules
import { Resource, Collection } from "jsr:@yourusername/hyperdeno/core";
import { Router } from "jsr:@yourusername/hyperdeno/http";
```

## Quick Start

```ts
import { createApp, Resource, Collection } from "jsr:@yourusername/hyperdeno";

// Create app
const app = createApp({ 
  port: 3000,
  onListen: ({ hostname, port }) => {
    console.log(`Server running at http://${hostname}:${port}`);
  }
});

// Define API root
app.router.get("/api", () => {
  return new Resource()
    .setType("api")
    .setProperty("name", "Example API")
    .setProperty("version", "1.0.0")
    .addLink("self", "/api")
    .addLink("users", "/api/users");
});

// Define collection endpoint
app.router.get("/api/users", () => {
  const users = [
    new Resource({ type: "user", id: "1", properties: { name: "Alice" }}),
    new Resource({ type: "user", id: "2", properties: { name: "Bob" }})
  ];
  
  users.forEach(user => {
    user.addLink("self", `/api/users/${user.getId()}`);
  });
  
  const collection = new Collection({ type: "users", items: users });
  collection.addLink("self", "/api/users");
  
  return collection;
});

// Define resource endpoint
app.router.get("/api/users/:id", (req, params) => {
  const user = new Resource({
    type: "user",
    id: params.id,
    properties: { name: "User " + params.id }
  });
  
  user.addLink("self", `/api/users/${params.id}`);
  user.addLink("collection", "/api/users");
  
  return user;
});

// Start the server
await app.start();
```

## Key Concepts

### Resources

Resources are the core building blocks of a HATEOAS API:

```ts
const user = new Resource()
  .setType("user")
  .setId("123")
  .setProperty("name", "John Doe")
  .setProperty("email", "john@example.com")
  .addLink("self", "/api/users/123")
  .addLink("edit", "/api/users/123", "PUT")
  .addLink("delete", "/api/users/123", "DELETE");
```

### Collections

Collections represent groups of resources with pagination support:

```ts
const collection = new Collection({ type: "users" });

collection.addItems(userResources);
collection.setPage(2);
collection.setPageSize(10);
collection.setTotal(57);
collection.addPaginationLinks("/api/users");
```

### State Transitions

Resources can have state with defined transitions:

```ts
const order = new Resource()
  .setType("order")
  .setId("456")
  .setProperty("total", 99.99)
  .setState("draft");
  
order.addTransition("draft", "submitted", "submit", "/api/orders/456/submit", "POST");
order.addTransition("submitted", "approved", "approve", "/api/orders/456/approve", "POST");
order.addTransition("approved", "shipped", "ship", "/api/orders/456/ship", "POST");

// Get available transitions
const transitions = order.getAvailableTransitions();

// Apply a transition
order.applyTransition("submit");
console.log(order.getState()); // "submitted"
```

### Content Negotiation

The framework supports multiple content types out of the box:

```ts
// Client can request different formats using Accept header
// Accept: application/json
// Accept: application/hal+json
// Accept: text/html

// Or use query parameter
// GET /api/users/123?format=json
// GET /api/users/123?format=hal
// GET /api/users/123?format=html
```

## Modules

### Core

- **Resource**: Base hypermedia resource class
- **Collection**: Resource collection with pagination
- **LinkManager**: Handles hypermedia links
- **ResourceState**: Manages resource state transitions
- **Errors**: Standardized error types

### HTTP

- **Router**: Web standard router
- **Request**: Request parsing and validation
- **Response**: Response creation helpers
- **ContentType**: Content negotiation utilities

### Rendering

- **Renderer**: Base class for content renderers
- **RendererFactory**: Content negotiation and renderer selection
- **HalRenderer**: HAL+JSON renderer
- **HtmlRenderer**: HTML renderer

### Util

- **Validation**: Request validation utilities

## Full Documentation

Visit our [full documentation](https://yourusername.github.io/hyperdeno/) for detailed API reference, guides, and examples.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```

## 9. Publishing Your Package

Once you've implemented all the changes above, you'll need to publish your package to JSR:

1. Sign up for a JSR account if you don't have one
2. Authenticate with JSR: `deno jsr login`
3. Publish your package: `deno publish`

## 10. Recommended Updates to Existing Files

Beyond creating new files, you should also update any existing imports in your code to use the new module structure. For example, if you have tests that import directly from specific files, update them to use the new module paths.

For example, change:
```typescript
import { Resource } from "../../hyperdeno/core/resource.ts";
```

To:
```typescript
import { Resource } from "../../hyperdeno/core/mod.ts";
```

Or for external usage:
```typescript
import { Resource } from "jsr:@yourusername/hyperdeno/core";
```

## 11. Next Steps

After implementing these changes, your HyperDeno framework will be properly organized as a modern Deno library with JSR compatibility. Some additional steps you might want to take:

1. Set up GitHub Actions for automated testing and publishing
2. Create more examples to showcase different features
3. Improve test coverage
4. Add more detailed JSDoc comments for better type hinting
5. Create a documentation website using Deno's built-in doc generator

Good luck with your library!
