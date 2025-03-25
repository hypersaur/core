# HyperDeno Documentation

## Table of Contents

1. [Introduction](#introduction)
   - [What is HATEOAS?](#what-is-hateoas)
   - [HyperDeno Philosophy](#hyperdeno-philosophy)
   - [Key Concepts](#key-concepts)
2. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Creating an Application](#creating-an-application)
   - [Basic Example](#basic-example)
3. [Core Components](#core-components)
   - [Resources](#resources)
   - [Collections](#collections)
   - [Links](#links)
   - [State Machine](#state-machine)
   - [HAL-Forms](#hal-forms)
4. [Resource Definition System](#resource-definition-system)
   - [Schema Definition](#schema-definition)
   - [Route Handlers](#route-handlers)
   - [Data Transformation](#data-transformation)
   - [Resource Registration](#resource-registration)
5. [HTTP Features](#http-features)
   - [Router](#router)
   - [Request Processing](#request-processing)
   - [Response Generation](#response-generation)
   - [Content Negotiation](#content-negotiation)
   - [Validation](#validation)
6. [Middleware System](#middleware-system)
   - [Creating Middleware](#creating-middleware)
   - [Middleware Chain](#middleware-chain)
   - [Context State](#context-state)
   - [Common Middleware Patterns](#common-middleware-patterns)
7. [Plugin System](#plugin-system)
   - [Plugin Structure](#plugin-structure)
   - [Hooks](#hooks)
   - [Plugin Registration](#plugin-registration)
   - [Creating Plugins](#creating-plugins)
8. [Renderer System](#renderer-system)
   - [Built-in Renderers](#built-in-renderers)
   - [Custom Renderers](#custom-renderers)
   - [Content Type Negotiation](#content-type-negotiation)
9. [Event System](#event-system)
   - [Framework Events](#framework-events)
   - [Custom Events](#custom-events)
   - [Event Handlers](#event-handlers)
10. [Configuration System](#configuration-system)
    - [Server Configuration](#server-configuration)
    - [Framework Configuration](#framework-configuration)
    - [Dynamic Configuration](#dynamic-configuration)
11. [Error Handling](#error-handling)
    - [Error Types](#error-types)
    - [Error Responses](#error-responses)
    - [Custom Error Handlers](#custom-error-handlers)
12. [Advanced Usage](#advanced-usage)
    - [Authentication and Authorization](#authentication-and-authorization)
    - [Caching](#caching)
    - [Versioning](#versioning)
    - [Testing](#testing)
13. [Best Practices](#best-practices)
    - [Resource Design](#resource-design)
    - [Link Relations](#link-relations)
    - [State Transitions](#state-transitions)
    - [Error Handling](#error-handling-best-practices)
14. [API Reference](#api-reference)
    - [Classes](#classes)
    - [Functions](#functions)
    - [Interfaces](#interfaces)
    - [Constants](#constants)
15. [Examples](#examples)
    - [Blog API](#blog-api)
    - [E-commerce API](#e-commerce-api)
    - [Task Management API](#task-management-api)

## Introduction

HyperDeno is a modern, resource-centric framework for building hypermedia-driven APIs using Deno. It embraces HATEOAS principles to create self-describing, navigable APIs that clients can explore and interact with dynamically.

### What is HATEOAS?

HATEOAS (Hypermedia as the Engine of Application State) is a constraint of the REST application architecture that keeps the RESTful style architecture completely decoupled from the client. With HATEOAS, a client interacts with a network application entirely through hypermedia provided dynamically by application servers. A HATEOAS API provides information to navigate the API dynamically by including hypermedia links with the responses.

The key principles of HATEOAS are:

1. **Self-descriptive messages**: Each response contains enough information to describe how to process the message
2. **Hypermedia-driven**: Responses include links to related resources and possible actions
3. **Stateless interaction**: Each request from client to server must contain all information needed to understand the request
4. **Uniform interface**: Resources are identified and manipulated through a consistent interface

### HyperDeno Philosophy

HyperDeno follows these core principles:

1. **Resource-First Approach**: Resources are the central building block of the API
2. **Hypermedia Controls**: APIs should provide links and forms to guide clients
3. **Self-Describing**: Responses should contain all the information needed to use them
4. **Content Negotiation**: Resources can be represented in different formats
5. **Extensibility**: The framework should be easy to extend and customize

### Key Concepts

- **Resources**: The fundamental units of your API that represent domain entities
- **Collections**: Groups of resources with pagination support
- **Links**: Hypermedia controls that connect resources and actions
- **State Transitions**: Defined paths for resource state changes
- **HAL-Forms**: Forms that describe available actions and inputs

## Getting Started

### Installation

You can use HyperDeno by importing it directly from a URL or copying the file to your project:

```typescript
// Import from URL
import HyperDeno from "https://raw.githubusercontent.com/yourusername/hyperdeno/main/hyperdeno.ts";

// Or use a local copy
import HyperDeno from "./hyperdeno.ts";
```

### Creating an Application

To create a HyperDeno application:

```typescript
import HyperDeno from "./hyperdeno.ts";

const app = HyperDeno.createApp({
  port: 3000,
  hostname: "0.0.0.0",
  onListen: ({ hostname, port }) => {
    console.log(`Server running at http://${hostname}:${port}`);
  }
});

// Define resources, routes, etc.

// Start the server
await app.start();
```

### Basic Example

Here's a complete example of a basic API:

```typescript
import HyperDeno from "./hyperdeno.ts";

const app = HyperDeno.createApp({ port: 3000 });

// Define a resource
app.defineResource("user", {
  schema: {
    fields: {
      name: { type: "string", required: true },
      email: { type: "string", required: true }
    }
  },
  routes: {
    base: "/api/users",
    
    // List all users
    list: async (req) => {
      return [
        { id: "1", name: "Alice", email: "alice@example.com" },
        { id: "2", name: "Bob", email: "bob@example.com" }
      ];
    },
    
    // Get a single user
    get: async (req, id) => {
      return { id, name: "Alice", email: "alice@example.com" };
    },
    
    // Create a new user
    create: async (req, data) => {
      console.log("Creating user:", data);
      return { id: "3", ...data };
    }
  }
});

// Add API root
app.router.get("/api", () => {
  return HyperDeno.createResource({
    type: "api",
    properties: {
      name: "User API",
      version: "1.0.0"
    },
    links: {
      self: "/api",
      users: "/api/users"
    }
  });
});

// Register resource routes
app.registerResources();

// Start the server
await app.start();
```

## Core Components

### Resources

Resources are the fundamental building blocks of a HATEOAS API. In HyperDeno, resources have properties, links, embedded resources, and state.

#### Creating Resources

```typescript
// Using the factory function
const user = HyperDeno.createResource({
  type: "user",
  id: "123",
  properties: {
    name: "John Doe",
    email: "john@example.com"
  },
  links: {
    self: "/api/users/123",
    edit: "/api/users/123/edit"
  },
  state: "active"
});

// Or using the Resource class
const product = new HyperDeno.Resource({
  type: "product",
  id: "456",
  properties: {
    name: "Widget",
    price: 19.99
  }
});

// Add links
product.addLink("self", "/api/products/456");
product.addLink("edit", "/api/products/456/edit", "PUT");
product.addLink("delete", "/api/products/456", "DELETE");

// Add templated links
product.addTemplatedLink("search", "/api/products/search{?q,category}");

// Set properties
product.setProperty("description", "An awesome widget");
product.setProperty("inStock", true);

// Get properties
const price = product.getProperty("price"); // 19.99

// Embed related resources
const category = HyperDeno.createResource({
  type: "category",
  id: "789",
  properties: { name: "Gadgets" }
});
product.embed("category", category);

// Convert to JSON
const json = product.toJSON();
```

#### Resource JSON Structure

Resources are serialized to JSON in this format:

```json
{
  "type": "product",
  "id": "456",
  "properties": {
    "name": "Widget",
    "price": 19.99,
    "description": "An awesome widget",
    "inStock": true
  },
  "links": {
    "self": {
      "href": "/api/products/456",
      "rel": "self",
      "method": "GET"
    },
    "edit": {
      "href": "/api/products/456/edit",
      "rel": "edit",
      "method": "PUT"
    },
    "delete": {
      "href": "/api/products/456",
      "rel": "delete",
      "method": "DELETE"
    },
    "search": {
      "href": "/api/products/search{?q,category}",
      "rel": "search",
      "method": "GET",
      "templated": true
    }
  },
  "embedded": {
    "category": [
      {
        "type": "category",
        "id": "789",
        "properties": { "name": "Gadgets" },
        "links": {}
      }
    ]
  },
  "state": "active"
}
```

### Collections

Collections are groups of resources with pagination support.

#### Creating Collections

```typescript
// Using the factory function
const users = HyperDeno.createCollection({
  type: "users",
  items: [user1, user2, user3],
  links: {
    self: "/api/users"
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 42
  },
  collectionName: "users"
});

// Or using the Collection class
const products = new HyperDeno.Collection({
  type: "products"
});

// Add items
products.addItem(product1);
products.addItems([product2, product3]);

// Set pagination
products.setPagination({
  page: 1,
  pageSize: 20,
  total: 100
});

// Add pagination links
products.addPaginationLinks("/api/products");

// Sort items
products.sort((a, b) => {
  const priceA = a.getProperty("price") as number;
  const priceB = b.getProperty("price") as number;
  return priceA - priceB;
});

// Filter items
const inStockProducts = products.filter(item => 
  item.getProperty("inStock") === true
);

// Get items
const allProducts = products.getItems();
const count = products.getCount();

// Convert to JSON
const json = products.toJSON();
```

#### Collection JSON Structure

Collections are serialized to JSON in this format:

```json
{
  "type": "products",
  "properties": {},
  "links": {
    "self": { "href": "/api/products", "rel": "self", "method": "GET" },
    "first": { "href": "/api/products?page=1&pageSize=20", "rel": "first", "method": "GET" },
    "next": { "href": "/api/products?page=2&pageSize=20", "rel": "next", "method": "GET" },
    "last": { "href": "/api/products?page=5&pageSize=20", "rel": "last", "method": "GET" }
  },
  "embedded": {
    "products": [
      { "type": "product", "id": "1", "properties": { "name": "Widget A" }, "links": {} },
      { "type": "product", "id": "2", "properties": { "name": "Widget B" }, "links": {} },
      { "type": "product", "id": "3", "properties": { "name": "Widget C" }, "links": {} }
    ]
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

### Links

Links are hypermedia controls that connect resources and actions. They tell clients what they can do with a resource and how to navigate between resources.

#### Standard Link Relations

HyperDeno provides standard link relations:

```typescript
// Access standard relations
const selfRel = HyperDeno.STANDARD_RELS.SELF; // "self"
const nextRel = HyperDeno.STANDARD_RELS.NEXT; // "next"
const editRel = HyperDeno.STANDARD_RELS.EDIT; // "edit"
const deleteRel = HyperDeno.STANDARD_RELS.DELETE; // "delete"
```

Available standard relations:
- `SELF` - Link to the resource itself
- `NEXT` - Link to the next page in a collection
- `PREV` - Link to the previous page
- `FIRST` - Link to the first page
- `LAST` - Link to the last page
- `COLLECTION` - Link to a collection containing this resource
- `ITEM` - Link to a specific item in a collection
- `CREATE` - Link to create a new resource
- `EDIT` - Link to edit this resource
- `DELETE` - Link to delete this resource
- `UP` - Link to the parent resource

#### Link Options

Links can have additional options:

```typescript
resource.addLink("documentation", "/docs/product.html", "GET", {
  title: "Product Documentation",
  type: "text/html",
  hreflang: "en"
});

// Templated links
resource.addTemplatedLink("search", "/api/search{?q,category}", "GET", {
  title: "Search Products"
});
```

### State Machine

Resources can have states and transitions between them, forming a state machine.

#### State Transitions

```typescript
// Define an order resource with state transitions
const order = HyperDeno.createResource({
  type: "order",
  id: "123",
  properties: {
    total: 99.99,
    customer: "john@example.com"
  },
  state: "draft"
});

// Add transitions
order.addTransition("draft", "submitted", "submit", "/api/orders/123/submit", "POST");
order.addTransition("submitted", "processing", "process", "/api/orders/123/process", "POST");
order.addTransition("processing", "shipped", "ship", "/api/orders/123/ship", "POST");
order.addTransition("shipped", "delivered", "deliver", "/api/orders/123/deliver", "POST");
order.addTransition("submitted", "cancelled", "cancel", "/api/orders/123/cancel", "POST");
order.addTransition("processing", "cancelled", "cancel", "/api/orders/123/cancel", "POST");

// Add conditional transition
order.addTransition(
  "draft", "submitted", "submit-with-payment", 
  "/api/orders/123/submit-with-payment", "POST",
  { paymentMethod: "credit-card" } // Only available if this condition is met
);

// Get available transitions
const availableTransitions = order.getAvailableTransitions();
// Returns transitions available from the current state

// Apply a transition
order.applyTransition("submit");
console.log(order.getState()); // "submitted"

// Try to apply an invalid transition
try {
  order.applyTransition("ship"); // Error: Cannot transition from "submitted" to "shipped"
} catch (err) {
  console.error(err);
}
```

### HAL-Forms

HAL-Forms extend HATEOAS by providing a way to describe the inputs needed for actions. They're essential for helping clients understand how to interact with resources.

#### Creating Forms

```typescript
// Add a form template for creating an order
resource.addTemplate("create-order", {
  method: "POST",
  target: "/api/orders",
  title: "Create Order",
  properties: [
    {
      name: "product",
      type: "text",
      required: true,
      prompt: "Product ID"
    },
    {
      name: "quantity",
      type: "number",
      required: true,
      prompt: "Quantity",
      min: 1
    },
    {
      name: "shippingMethod",
      type: "text",
      required: true,
      prompt: "Shipping Method",
      options: {
        inline: [
          { value: "standard", prompt: "Standard (3-5 days)" },
          { value: "express", prompt: "Express (1-2 days)" },
          { value: "overnight", prompt: "Overnight" }
        ]
      }
    }
  ]
});

// Convenient method for adding forms
resource.addAction(
  "update-status",
  "PUT",
  [
    {
      name: "status",
      type: "text",
      required: true,
      prompt: "Status",
      options: {
        inline: [
          { value: "processing", prompt: "Processing" },
          { value: "shipped", prompt: "Shipped" },
          { value: "delivered", prompt: "Delivered" }
        ]
      }
    }
  ],
  "/api/orders/123/status",
  "Update Order Status"
);
```

#### HAL-Forms JSON Structure

HAL-Forms are serialized in the resource's JSON response:

```json
{
  "type": "order",
  "id": "123",
  "properties": { "total": 99.99 },
  "links": { "self": { "href": "/api/orders/123" } },
  "_templates": {
    "create-order": {
      "method": "POST",
      "target": "/api/orders",
      "title": "Create Order",
      "properties": [
        {
          "name": "product",
          "type": "text",
          "required": true,
          "prompt": "Product ID"
        },
        {
          "name": "quantity",
          "type": "number",
          "required": true,
          "prompt": "Quantity",
          "min": 1
        },
        {
          "name": "shippingMethod",
          "type": "text",
          "required": true,
          "prompt": "Shipping Method",
          "options": {
            "inline": [
              { "value": "standard", "prompt": "Standard (3-5 days)" },
              { "value": "express", "prompt": "Express (1-2 days)" },
              { "value": "overnight", "prompt": "Overnight" }
            ]
          }
        }
      ]
    }
  }
}
```

## Resource Definition System

The Resource Definition System is one of HyperDeno's most powerful features. It allows you to define resources declaratively with schemas, validation, and automatic route generation.

### Schema Definition

Schemas define the structure and validation rules for resources:

```typescript
app.defineResource("product", {
  schema: {
    fields: {
      name: { 
        type: "string", 
        required: true 
      },
      price: { 
        type: "number", 
        required: true, 
        min: 0 
      },
      description: { 
        type: "string" 
      },
      inStock: { 
        type: "boolean", 
        default: true 
      },
      categories: { 
        type: "array" 
      },
      metadata: { 
        type: "object" 
      },
      sku: {
        type: "string",
        pattern: "^[A-Z]{2}[0-9]{6}$"
      },
      rating: {
        type: "number",
        min: 1,
        max: 5
      },
      tags: {
        type: "array",
        validate: (value) => {
          // Custom validation logic
          return Array.isArray(value) && value.every(tag => typeof tag === "string");
        }
      }
    }
  },
  routes: {
    // Route handlers (covered in next section)
  }
});
```

### Route Handlers

Route handlers implement the CRUD operations for resources:

```typescript
app.defineResource("product", {
  schema: { /* ... */ },
  routes: {
    base: "/api/products",
    
    // GET /api/products
    list: async (req) => {
      // In a real app, fetch from database
      return [
        { id: "1", name: "Widget A", price: 19.99 },
        { id: "2", name: "Widget B", price: 29.99 }
      ];
    },
    
    // GET /api/products/:id
    get: async (req, id) => {
      // In a real app, fetch by ID from database
      return { 
        id, 
        name: "Widget A", 
        price: 19.99, 
        description: "An awesome widget",
        inStock: true 
      };
    },
    
    // POST /api/products
    create: async (req, data) => {
      // In a real app, save to database
      console.log("Creating product:", data);
      const id = "new_" + Math.floor(Math.random() * 1000);
      return { id, ...data };
    },
    
    // PUT /api/products/:id
    update: async (req, id, data) => {
      // In a real app, update in database
      console.log(`Updating product ${id}:`, data);
      return { id, ...data };
    },
    
    // DELETE /api/products/:id
    delete: async (req, id) => {
      // In a real app, delete from database
      console.log(`Deleting product ${id}`);
    }
  }
});
```

### Data Transformation

You can transform data before it's used to create resources:

```typescript
app.defineResource("product", {
  schema: { /* ... */ },
  routes: { /* ... */ },
  
  // Transform data before creating resources
  transform: (data) => {
    const transformed = { ...data as Record<string, unknown> };
    
    // Convert price to number if it's a string
    if (typeof transformed.price === "string") {
      transformed.price = parseFloat(transformed.price);
    }
    
    // Add timestamp
    transformed.lastUpdated = new Date().toISOString();
    
    // Format name
    if (typeof transformed.name === "string") {
      transformed.name = transformed.name.trim();
    }
    
    return transformed;
  }
});
```

### Resource Registration

After defining resources, you need to register their routes:

```typescript
// Register all defined resources
app.registerResources();

// This creates all the RESTful routes for your resources
```

## HTTP Features

### Router

HyperDeno includes a flexible router for handling HTTP requests:

```typescript
// Basic routes
app.router.get("/api", (req) => {
  return HyperDeno.createResource({ 
    type: "api",
    properties: { version: "1.0.0" }
  });
});

app.router.post("/api/login", async (req) => {
  const data = await req.json();
  // Handle login logic
  return new Response(JSON.stringify({ token: "..." }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});

// Routes with path parameters
app.router.get("/api/items/:category/:id", (req, params) => {
  const { category, id } = params;
  // Return item by category and id
});

// Regular expression routes
app.router.get(/^\/docs\/(.+)$/, (req) => {
  // Handle documentation routes
});

// Resource routes
app.router.resource("/api/categories", {
  list: async (req) => {
    // List all categories
  },
  get: async (req, id) => {
    // Get category by id
  }
  // Other CRUD handlers
});

// Handle all methods
app.router.all("/api/ping", (req) => {
  return new Response("pong");
});

// Custom 404 handler
app.router.setNotFoundHandler((req) => {
  return new Response("Not Found", { status: 404 });
});

// Custom error handler
app.router.setErrorHandler((error) => {
  console.error("Error:", error);
  return new Response("Internal Server Error", { status: 500 });
});
```

### Request Processing

Processing requests in HyperDeno:

```typescript
// Get query parameters
app.router.get("/api/search", async (req) => {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "10");
  
  // Perform search
  const results = await searchDatabase(query, limit);
  
  return HyperDeno.createCollection({
    type: "searchResults",
    items: results.map(item => 
      HyperDeno.createResource({
        type: "result",
        id: item.id,
        properties: item
      })
    )
  });
});

// Parse request body
app.router.post("/api/items", async (req) => {
  try {
    // Parse and validate body
    const data = await HyperDeno.validateBody(req, {
      name: { type: "string", required: true },
      price: { type: "number", required: true, min: 0 }
    });
    
    // Create item
    const item = await createItem(data);
    
    return HyperDeno.createResource({
      type: "item",
      id: item.id,
      properties: item
    });
  } catch (err) {
    if (err instanceof HyperDeno.ValidationError) {
      return HyperDeno.createErrorResponse(err);
    }
    throw err;
  }
});
```

### Response Generation

Creating responses in HyperDeno:

```typescript
// Create a response from a resource
app.router.get("/api/products/:id", async (req, params) => {
  const product = await getProduct(params.id);
  
  if (!product) {
    throw new HyperDeno.NotFoundError(`Product ${params.id} not found`);
  }
  
  const resource = HyperDeno.createResource({
    type: "product",
    id: product.id,
    properties: product
  });
  
  // Add links
  resource.addLink("self", `/api/products/${product.id}`);
  resource.addLink("collection", "/api/products");
  
  // The createResponse function handles converting to proper Response
  return HyperDeno.createResponse(resource);
});

// Create a custom response
app.router.get("/api/download", (req) => {
  // Create a binary response
  return new Response(binaryData, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "attachment; filename=\"file.bin\""
    }
  });
});

// Create a JSON response directly
app.router.get("/api/status", (req) => {
  return HyperDeno.createJsonResponse({
    status: "ok",
    time: new Date().toISOString()
  });
});

// Create an error response
app.router.get("/api/error", (req) => {
  const error = new HyperDeno.ValidationError("Something went wrong");
  return HyperDeno.createErrorResponse(error);
});
```

### Content Negotiation

HyperDeno supports content negotiation to serve resources in different formats:

```typescript
app.router.get("/api/products/:id", async (req, params) => {
  const product = await getProduct(params.id);
  
  if (!product) {
    throw new HyperDeno.NotFoundError(`Product ${params.id} not found`);
  }
  
  const resource = HyperDeno.createResource({
    type: "product",
    id: product.id,
    properties: product
  });
  
  // The renderer system will handle content negotiation based on Accept header
  return HyperDeno.createResponse(resource);
  
  // Client can request different formats:
  // - Accept: application/json
  // - Accept: application/hal+json
  // - Accept: text/plain
  // - Or use ?format=json, ?format=hal, ?format=text in the URL
});
```

### Validation

Validating request data:

```typescript
// Validate request body against a schema
app.router.post("/api/users", async (req) => {
  try {
    const data = await HyperDeno.validateBody(req, {
      username: { 
        type: "string", 
        required: true,
        minLength: 3,
        maxLength: 50
      },
      email: { 
        type: "string", 
        required: true,
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      },
      age: { 
        type: "number", 
        min: 18 
      },
      preferences: { 
        type: "object" 
      }
    });
    
    // Create user
    const user = await createUser(data);
    
    return HyperDeno.createResource({
      type: "user",
      id: user.id,
      properties: user
    });
  } catch (err) {
    if (err instanceof HyperDeno.ValidationError) {
      return HyperDeno.createErrorResponse(err);
    }
    throw err;
  }
});

// Validate any data manually
function validateProduct(product) {
  try {
    return HyperDeno.validate(product, {
      name: { type: "string", required: true },
      price: { type: "number", required: true, min: 0 }
    });
  } catch (err) {
    console.error("Validation failed:", err.details);
    throw err;
  }
}
```

## Middleware System

### Creating Middleware

Middleware functions process requests and responses:

```typescript
// Create a middleware function
function loggingMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  console.log(`Request: ${request.method} ${request.url}`);
  const start = performance.now();
  
  // Call the next middleware in the chain
  return next().then(response => {
    const duration = performance.now() - start;
    console.log(`Response: ${response.status} (${duration.toFixed(2)}ms)`);
    return response;
  });
}

// Add to the application
app.use(loggingMiddleware);

// Middleware with modifications
app.use(async (request, context, next) => {
  // Add a header to all requests
  const headers = new Headers(request.headers);
  headers.set("X-API-Version", "1.0.0");
  
  // Create a new request with the header
  const newRequest = new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    redirect: request.redirect,
    signal: request.signal
  });
  
  // Process the modified request
  const response = await next();
  
  // Modify the response
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("X-Processed-By", "HyperDeno");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
});
```

### Middleware Chain

The middleware chain processes requests in order:

```typescript
// Multiple middleware functions
app.use(corsMiddleware);
app.use(loggingMiddleware);
app.use(authMiddleware);
app.use(cachingMiddleware);

// They execute in the order they're added
// 1. corsMiddleware
// 2. loggingMiddleware
// 3. authMiddleware
// 4. cachingMiddleware
// 5. Route handler
// Then the response flows back through the chain in reverse
```

### Context State

Middleware can share data through the context state:

```typescript
// Authentication middleware
app.use(async (request, context, next) => {
  const authHeader = request.headers.get("Authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      // Verify token (in a real app)
      const user = await verifyToken(token);
      
      // Store user in context
      context.state.user = user;
    } catch (err) {
      // Invalid token
      return new Response("Unauthorized", { status: 401 });
    }
  }
  
  return next();
});

// Route that uses the authenticated user
app.router.get("/api/me", (request, params) => {
  // Access user from context
  const user = request.context?.state.user;
  
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  return HyperDeno.createResource({
    type: "user",
    id: user.id,
    properties: user
  });
});
```

### Common Middleware Patterns

#### CORS Middleware

```typescript
function corsMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return Promise.resolve(new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    }));
  }
  
  // For actual requests, add CORS headers to the response
  return next().then(response => {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  });
}
```

#### Request ID Middleware

```typescript
function requestIdMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  // Generate a unique request ID
  const requestId = crypto.randomUUID();
  
  // Store in context
  context.state.requestId = requestId;
  
  // Add to request headers for logging
  const headers = new Headers(request.headers);
  headers.set("X-Request-ID", requestId);
  
  // Create new request with added header
  const newRequest = new Request(request.url, {
    method: request.method,
    headers,
    body: request.body
  });
  
  // Process the request
  return next().then(response => {
    // Add request ID to response
    const headers = new Headers(response.headers);
    headers.set("X-Request-ID", requestId);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  });
}
```

#### Authentication Middleware

```typescript
function authMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  // Check for protected routes
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/admin")) {
    // Require authentication for admin routes
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Promise.resolve(new Response("Unauthorized", { status: 401 }));
    }
    
    const token = authHeader.substring(7);
    
    // Verify token (in a real app, this would validate against a database or JWT)
    if (token !== "valid-admin-token") {
      return Promise.resolve(new Response("Forbidden", { status: 403 }));
    }
    
    // Store user role in context
    context.state.user = { role: "admin" };
  }
  
  return next();
}
```

## Plugin System

### Plugin Structure

Plugins have a standardized structure:

```typescript
import HyperDeno from "./hyperdeno.ts";

// Create a plugin
const myPlugin: HyperDeno.Plugin = {
  // Required: unique name
  name: "my-plugin",
  
  // Optional: version
  version: "1.0.0",
  
  // Optional: initialization function
  initialize: (app) => {
    console.log("My plugin initialized");
    // Set up plugin state or resources
  },
  
  // Optional: hooks for framework events
  hooks: {
    [HyperDeno.HookType.BEFORE_ROUTE_HANDLE]: (request) => {
      console.log(`Processing route: ${request.method} ${request.url}`);
    },
    [HyperDeno.HookType.AFTER_ROUTE_HANDLE]: (request, response) => {
      console.log(`Route processed: ${response.status}`);
    }
  },
  
  // Optional: middleware to add to the pipeline
  middlewares: [
    async (request, context, next) => {
      // Plugin middleware
      console.log("Plugin middleware running");
      return await next();
    }
  ]
};

export default myPlugin;
```

### Hooks

Hooks allow plugins to observe and modify framework behavior:

```typescript
// Available hook types
const hooks = {
  // Before a route is handled
  [HyperDeno.HookType.BEFORE_ROUTE_HANDLE]: (request, path) => {
    console.log(`Route ${path} is about to be handled`);
  },
  
  // After a route is handled
  [HyperDeno.HookType.AFTER_ROUTE_HANDLE]: (request, response) => {
    console.log(`Route handled with status ${response.status}`);
  },
  
  // Before an error is handled
  [HyperDeno.HookType.BEFORE_ERROR_HANDLE]: (error) => {
    console.error(`Error about to be handled: ${error.message}`);
  },
  
  // After an error is handled
  [HyperDeno.HookType.AFTER_ERROR_HANDLE]: (error, response) => {
    console.error(`Error handled with status ${response.status}`);
  },
  
  // Before a response is sent
  [HyperDeno.HookType.BEFORE_RESPONSE_SEND]: (response) => {
    console.log(`Response about to be sent: ${response.status}`);
  },
  
  // Before a resource is created
  [HyperDeno.HookType.BEFORE_RESOURCE_CREATE]: (data) => {
    console.log(`Resource creation data:`, data);
  },
  
  // After a resource is created
  [HyperDeno.HookType.AFTER_RESOURCE_CREATE]: (resource) => {
    console.log(`Resource created: ${resource.getType()} ${resource.getId()}`);
  }
};
```

### Plugin Registration

Register plugins with the application:

```typescript
// Register during app creation
const app = HyperDeno.createApp({
  plugins: [
    loggingPlugin,
    authPlugin,
    cachePlugin
  ]
});

// Or register after creation
app.registerPlugin(analyticsPlugin);
```

### Creating Plugins

Common plugin patterns:

#### Logging Plugin

```typescript
// Create a logging plugin
const loggingPlugin: HyperDeno.Plugin = {
  name: "logging-plugin",
  version: "1.0.0",
  
  hooks: {
    [HyperDeno.HookType.BEFORE_ROUTE_HANDLE]: (request) => {
      console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
    },
    
    [HyperDeno.HookType.AFTER_ROUTE_HANDLE]: (request, response) => {
      console.log(`${new Date().toISOString()} - Response: ${response.status}`);
    },
    
    [HyperDeno.HookType.BEFORE_ERROR_HANDLE]: (error) => {
      console.error(`${new Date().toISOString()} - Error: ${error.message}`);
    }
  },
  
  middlewares: [
    async (request, context, next) => {
      const start = performance.now();
      const response = await next();
      const duration = performance.now() - start;
      
      console.log(`Request completed in ${duration.toFixed(2)}ms`);
      
      return response;
    }
  ]
};
```

#### Authentication Plugin

```typescript
// Create an authentication plugin
const authPlugin: HyperDeno.Plugin = {
  name: "auth-plugin",
  version: "1.0.0",
  
  initialize: (app) => {
    // Set up auth routes
    app.router.post("/api/login", async (req) => {
      const { username, password } = await req.json();
      
      // In a real app, verify against database
      if (username === "admin" && password === "password") {
        return HyperDeno.createJsonResponse({
          token: "valid-token",
          user: { id: "1", username: "admin" }
        });
      }
      
      return HyperDeno.createJsonResponse({ 
        error: "Invalid credentials" 
      }, { status: 401 });
    });
  },
  
  middlewares: [
    async (request, context, next) => {
      // Check for protected routes
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/protected")) {
        const authHeader = request.headers.get("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        
        const token = authHeader.substring(7);
        
        // In a real app, verify token
        if (token !== "valid-token") {
          return new Response("Forbidden", { status: 403 });
        }
        
        // Add user to context
        context.state.user = { id: "1", username: "admin" };
      }
      
      return await next();
    }
  ]
};
```

#### Caching Plugin

```typescript
// Create a caching plugin
const cachePlugin: HyperDeno.Plugin = {
  name: "cache-plugin",
  version: "1.0.0",
  
  initialize: (app) => {
    console.log("Cache plugin initialized");
  },
  
  middlewares: [
    async (request, context, next) => {
      // Only cache GET requests
      if (request.method !== "GET") {
        return await next();
      }
      
      const cacheKey = request.url;
      
      // Check cache (in a real app, use a proper cache store)
      const cachedResponse = await checkCache(cacheKey);
      if (cachedResponse) {
        console.log(`Cache hit for ${cacheKey}`);
        return cachedResponse;
      }
      
      // Get response from next middleware
      const response = await next();
      
      // Only cache successful responses
      if (response.status === 200) {
        // Clone the response before storing it
        const responseToCache = response.clone();
        await cacheResponse(cacheKey, responseToCache);
      }
      
      return response;
    }
  ]
};

// Dummy cache functions (in a real app, use a proper cache)
const cache = new Map();

async function checkCache(key: string): Promise<Response | null> {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.response.clone();
  }
  return null;
}

async function cacheResponse(key: string, response: Response): Promise<void> {
  // Clone and store the response
  const clonedResponse = response.clone();
  
  // Store in cache for 5 minutes
  cache.set(key, {
    response: clonedResponse,
    expires: Date.now() + 5 * 60 * 1000
  });
}
```

## Renderer System

### Built-in Renderers

HyperDeno includes several built-in renderers:

1. **JsonRenderer**: Renders resources as standard JSON
2. **HalRenderer**: Renders resources as HAL+JSON format
3. **TextRenderer**: Renders resources as plain text

The renderer system automatically selects the appropriate renderer based on the client's Accept header or format query parameter.

### Custom Renderers

You can create custom renderers for specific media types:

```typescript
import HyperDeno from "./hyperdeno.ts";

// Create a custom XML renderer
class XmlRenderer implements HyperDeno.ResourceRenderer {
  mediaType = "application/xml";
  
  canRender(_resource: HyperDeno.Resource | HyperDeno.Collection): boolean {
    return true; // Can render any resource
  }
  
  render(resource: HyperDeno.Resource | HyperDeno.Collection, options: any = {}): Response {
    const xml = this.toXml(resource.toJSON());
    
    const headers = {
      'Content-Type': 'application/xml',
      ...options.headers
    };
    
    return new Response(xml, {
      status: options.status || 200,
      headers
    });
  }
  
  private toXml(json: any, root = 'resource'): string {
    // XML conversion logic here
    // Convert JSON to XML format
    
    // Simple implementation (you'd want a more robust one)
    const attributes: string[] = [];
    const children: string[] = [];
    
    for (const [key, value] of Object.entries(json)) {
      if (key === 'type' || key === 'id') {
        attributes.push(`${key}="${value}"`);
      } else if (typeof value === 'object' && value !== null) {
        children.push(this.objectToXml(key, value));
      } else {
        children.push(`<${key}>${value}</${key}>`);
      }
    }
    
    if (children.length === 0) {
      return `<${root} ${attributes.join(' ')}/>`;
    }
    
    return `<${root} ${attributes.join(' ')}>${children.join('')}</${root}>`;
  }
  
  private objectToXml(name: string, obj: any): string {
    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToXml(name, item)).join('');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const attrs: string[] = [];
      const children: string[] = [];
      
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'object' && v !== null) {
          children.push(this.objectToXml(k, v));
        } else {
          children.push(`<${k}>${v}</${k}>`);
        }
      }
      
      return `<${name}>${children.join('')}</${name}>`;
    }
    
    return `<${name}>${obj}</${name}>`;
  }
}

// Register the renderer
app.registerRenderer(new XmlRenderer());
```

### Content Type Negotiation

The renderer system uses content negotiation to select the appropriate renderer:

```typescript
// Client request with Accept header
// GET /api/products/123
// Accept: application/xml

// The framework will:
// 1. Find a renderer for application/xml
// 2. Use it to render the resource
// 3. Return the response with Content-Type: application/xml

// Format can also be specified in the URL
// GET /api/products/123?format=xml
```

## Event System

### Framework Events

HyperDeno includes built-in events for important framework actions:

```typescript
// Listen for server start
app.on(HyperDeno.FrameworkEvent.SERVER_START, ({ port, hostname }) => {
  console.log(`Server started at http://${hostname}:${port}`);
});

// Listen for server stop
app.on(HyperDeno.FrameworkEvent.SERVER_STOP, () => {
  console.log("Server stopped");
});

// Listen for request start
app.on(HyperDeno.FrameworkEvent.REQUEST_START, ({ request }) => {
  console.log(`Request started: ${request.method} ${request.url}`);
});

// Listen for request end
app.on(HyperDeno.FrameworkEvent.REQUEST_END, ({ request, response }) => {
  console.log(`Request ended: ${request.method} ${request.url} - ${response.status}`);
});

// Listen for errors
app.on(HyperDeno.FrameworkEvent.ERROR, ({ error, request }) => {
  console.error(`Error during ${request.method} ${request.url}:`, error);
});

// Listen for resource events
app.on(HyperDeno.FrameworkEvent.RESOURCE_CREATED, ({ resource }) => {
  console.log(`Resource created: ${resource.getType()} ${resource.getId()}`);
});

app.on(HyperDeno.FrameworkEvent.RESOURCE_UPDATED, ({ resource, changes }) => {
  console.log(`Resource updated: ${resource.getType()} ${resource.getId()}`, changes);
});

app.on(HyperDeno.FrameworkEvent.RESOURCE_DELETED, ({ type, id }) => {
  console.log(`Resource deleted: ${type} ${id}`);
});
```

### Custom Events

You can create and listen for custom events:

```typescript
// Get the event emitter
const emitter = app.server.getEventEmitter();

// Register an event handler
emitter.on('order:created', (order) => {
  console.log(`Order ${order.id} was created`);
  // Send confirmation email, update inventory, etc.
});

// Register a one-time handler
emitter.once('application:init', () => {
  console.log("Application initialized - this runs only once");
});

// Emit custom events
emitter.emit('order:created', { 
  id: '123', 
  customer: 'john@example.com',
  total: 99.99
});

// Remove event handlers
const handler = (data) => console.log(data);
emitter.on('my-event', handler);
// ...later
emitter.off('my-event', handler);

// Remove all handlers for an event
emitter.removeAllListeners('my-event');

// Remove all handlers
emitter.removeAllListeners();
```

### Event Handlers

Event handlers receive event data:

```typescript
// Event handler with typed data
app.on(HyperDeno.FrameworkEvent.SERVER_START, (data: { port: number; hostname: string }) => {
  console.log(`Server started on port ${data.port}`);
});

// Custom event with typed data
interface OrderCreatedEvent {
  id: string;
  customer: string;
  total: number;
  items: Array<{ product: string; quantity: number; price: number }>;
}

const emitter = app.server.getEventEmitter();

emitter.on<OrderCreatedEvent>('order:created', (order) => {
  // TypeScript knows the shape of the order object
  console.log(`Order ${order.id} created by ${order.customer} for $${order.total}`);
  
  // Process each item
  for (const item of order.items) {
    console.log(`- ${item.quantity}x ${item.product} at $${item.price} each`);
  }
});
```

## Configuration System

### Server Configuration

Configure the server when creating the application:

```typescript
// Basic server configuration
const app = HyperDeno.createApp({
  port: 3000,
  hostname: "0.0.0.0",
  onListen: ({ hostname, port }) => {
    console.log(`Server running at http://${hostname}:${port}`);
  }
});
```

### Framework Configuration

Configure framework features:

```typescript
// Comprehensive configuration
const app = HyperDeno.createApp({
  // Server config
  port: 3000,
  hostname: "0.0.0.0",
  
  // Plugins
  plugins: [loggingPlugin, authPlugin],
  
  // Middlewares
  middlewares: [corsMiddleware, timingMiddleware],
  
  // Renderers
  renderers: [new XmlRenderer()],
  
  // Default media type
  defaultMediaType: HyperDeno.MEDIA_TYPES.HAL_JSON,
  
  // Event handlers
  eventHandlers: {
    [HyperDeno.FrameworkEvent.SERVER_START]: [
      () => console.log("Server started")
    ],
    [HyperDeno.FrameworkEvent.ERROR]: [
      (error) => console.error("Error:", error)
    ]
  },
  
  // Configuration object
  config: {
    // Error handling
    errorHandling: {
      detailed: true, // Include stack traces in errors
      handlers: {
        // Custom error handlers by error code
        'NOT_FOUND': (error) => new Response(`Not found: ${error.message}`, { status: 404 }),
        'VALIDATION_ERROR': (error) => new Response(`Invalid data: ${error.message}`, { status: 400 })
      }
    }
  }
});
```

### Dynamic Configuration

Update configuration at runtime:

```typescript
// Update configuration
app.configure({
  // Update default media type
  defaultMediaType: HyperDeno.MEDIA_TYPES.JSON,
  
  // Update error handling
  errorHandling: {
    detailed: process.env.NODE_ENV !== 'production'
  }
});

// Get configuration manager for more control
const configManager = app.server.getConfigManager();

// Get current configuration
const config = configManager.getConfig();
console.log("Current port:", config.port);

// Update a specific value
configManager.set('defaultMediaType', HyperDeno.MEDIA_TYPES.HAL_JSON);

// Get a specific value
const mediaType = configManager.get('defaultMediaType');
console.log("Default media type:", mediaType);
```

## Error Handling

### Error Types

HyperDeno provides specialized error types:

```typescript
// Generic API error
throw new HyperDeno.ApiError("Something went wrong", 500, "INTERNAL_ERROR", {
  context: "user_creation",
  userId: "123"
});

// Not found error (404)
throw new HyperDeno.NotFoundError("User not found", "USER_NOT_FOUND", {
  userId: "123"
});

// Validation error (400)
throw new HyperDeno.ValidationError("Invalid input", "INVALID_INPUT", {
  errors: {
    email: "Invalid email format",
    password: "Password too short"
  }
});

// Authentication error (401)
throw new HyperDeno.AuthError("Invalid credentials", "INVALID_CREDENTIALS");

// Server error (500)
throw new HyperDeno.ServerError("Database connection failed", "DB_ERROR", {
  dbName: "users"
});

// State transition error
throw new HyperDeno.StateTransitionError("Cannot transition from draft to shipped", {
  currentState: "draft",
  targetState: "shipped",
  allowedTransitions: ["submitted"]
});

// Invalid argument error
throw new HyperDeno.InvalidArgumentError("Invalid page size", {
  param: "pageSize",
  value: -1,
  expected: "positive integer"
});

// Content negotiation error
throw new HyperDeno.ContentNegotiationError("Unsupported media type", "MEDIA_TYPE_NOT_SUPPORTED", {
  requested: "application/xml",
  supported: ["application/json", "application/hal+json"]
});
```

### Error Responses

Errors are converted to standardized JSON responses:

```typescript
// Example of a NotFoundError response
{
  "error": {
    "message": "User not found",
    "status": 404,
    "code": "USER_NOT_FOUND",
    "details": {
      "userId": "123"
    }
  }
}

// Converting errors to responses
app.router.get("/api/users/:id", (req, params) => {
  try {
    const user = getUserById(params.id);
    
    if (!user) {
      throw new HyperDeno.NotFoundError(`User ${params.id} not found`, "USER_NOT_FOUND", {
        userId: params.id
      });
    }
    
    return HyperDeno.createResource({
      type: "user",
      id: user.id,
      properties: user
    });
  } catch (err) {
    // HyperDeno can convert any error to a proper response
    return HyperDeno.createErrorResponse(err);
  }
});
```

### Custom Error Handlers

Register custom error handlers:

```typescript
// Configure custom error handlers
app.configure({
  errorHandling: {
    detailed: process.env.NODE_ENV !== 'production',
    handlers: {
      // Not found errors
      'NOT_FOUND': (error) => {
        return new Response(`The requested resource was not found: ${error.message}`, {
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      },
      
      // Validation errors
      'VALIDATION_ERROR': (error) => {
        const details = error.details?.errors || {};
        
        return HyperDeno.createJsonResponse({
          error: "Validation failed",
          fields: details,
          message: error.message
        }, { status: 400 });
      },
      
      // Custom error code
      'RATE_LIMIT_EXCEEDED': (error) => {
        return new Response("Too many requests", {
          status: 429,
          headers: {
            'Content-Type': 'text/plain',
            'Retry-After': '60'
          }
        });
      }
    }
  }
});
```

## Advanced Usage

### Authentication and Authorization

Implementing authentication:

```typescript
// Authentication middleware
function authMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Promise.resolve(new Response("Unauthorized", { status: 401 }));
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify token (in a real app, you'd verify against a JWT or database)
    const user = verifyToken(token);
    
    // Store user in context
    context.state.user = user;
    
    return next();
  } catch (err) {
    return Promise.resolve(new Response("Invalid token", { status: 401 }));
  }
}

// Authorization middleware
function requireRole(role: string) {
  return async (request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> => {
    const user = context.state.user;
    
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    if (user.role !== role) {
      return new Response("Forbidden", { status: 403 });
    }
    
    return next();
  };
}

// Apply middleware
app.use(authMiddleware);
app.use(requireRole("admin"));

// Login route
app.router.post("/api/login", async (req) => {
  const { username, password } = await req.json();
  
  // Verify credentials (in a real app, check against database)
  if (username === "admin" && password === "password") {
    const token = generateToken({ id: "1", username, role: "admin" });
    
    return HyperDeno.createJsonResponse({
      token,
      user: { id: "1", username, role: "admin" }
    });
  }
  
  return HyperDeno.createJsonResponse({
    error: "Invalid credentials"
  }, { status: 401 });
});
```

### Caching

Implementing response caching:

```typescript
// Simple in-memory cache
const cache = new Map<string, { data: Response; expires: number }>();

// Caching middleware
function cacheMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  // Only cache GET requests
  if (request.method !== "GET") {
    return next();
  }
  
  const cacheKey = request.url;
  
  // Check if we have a cached response
  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && cachedEntry.expires > Date.now()) {
    // Return cached response
    return Promise.resolve(cachedEntry.data.clone());
  }
  
  // Get fresh response
  return next().then(response => {
    // Only cache successful responses
    if (response.status === 200) {
      // Cache for 5 minutes
      cache.set(cacheKey, {
        data: response.clone(),
        expires: Date.now() + 5 * 60 * 1000
      });
    }
    
    return response;
  });
}

// Add ETag support
function etagMiddleware(request: Request, context: HyperDeno.RequestContext, next: () => Promise<Response>): Promise<Response> {
  return next().then(async response => {
    // Only add ETags for GET requests with 200 responses
    if (request.method === "GET" && response.status === 200) {
      const body = await response.clone().text();
      
      // Generate ETag (in a real app, use a proper hash function)
      const etag = `"${body.length.toString(16)}"`;
      
      // Check If-None-Match header
      const ifNoneMatch = request.headers.get("If-None-Match");
      if (ifNoneMatch === etag) {
        // Return 304 Not Modified
        return new Response(null, { status: 304 });
      }
      
      // Add ETag header
      const headers = new Headers(response.headers);
      headers.set("ETag", etag);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    
    return response;
  });
}

// Apply caching middleware
app.use(cacheMiddleware);
app.use(etagMiddleware);
```

### Versioning

Implementing API versioning:

```typescript
// Version through URL path
app.router.get("/api/v1/users", (req) => {
  // V1 implementation
});

app.router.get("/api/v2/users", (req) => {
  // V2 implementation
});

// Version through Accept header
app.use(async (request, context, next) => {
  const acceptHeader = request.headers.get("Accept");
  
  if (acceptHeader?.includes("application/vnd.api.v2+json")) {
    context.state.apiVersion = "v2";
  } else {
    context.state.apiVersion = "v1";
  }
  
  return next();
});

app.router.get("/api/users", (request) => {
  const version = request.context?.state.apiVersion || "v1";
  
  if (version === "v2") {
    // V2 implementation
  } else {
    // V1 implementation
  }
});

// Version through query parameter
app.router.get("/api/users", (request) => {
  const url = new URL(request.url);
  const version = url.searchParams.get("version") || "v1";
  
  if (version === "v2") {
    // V2 implementation
  } else {
    // V1 implementation
  }
});
```

### Testing

Testing a HyperDeno application:

```typescript
// Using Deno's testing framework
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import HyperDeno from "./hyperdeno.ts";

// Create a test application
function createTestApp() {
  const app = HyperDeno.createApp();
  
  app.router.get("/api/test", () => {
    return HyperDeno.createJsonResponse({ result: "success" });
  });
  
  return app;
}

// Test a route
Deno.test("GET /api/test returns successful result", async () => {
  const app = createTestApp();
  const router = app.router;
  
  // Create a test request
  const request = new Request("http://localhost/api/test");
  
  // Process the request
  const response = await router.handle(request);
  
  // Assert the response
  assertEquals(response.status, 200);
  
  const body = await response.json();
  assertEquals(body.result, "success");
});

// Test a resource
Deno.test("Resource has correct links", () => {
  const resource = HyperDeno.createResource({
    type: "product",
    id: "123",
    links: {
      self: "/products/123"
    }
  });
  
  // Add links
  resource.addLink("edit", "/products/123/edit", "PUT");
  
  // Assert links
  const selfLink = resource.getLink("self");
  assertEquals((selfLink as Link).href, "/products/123");
  
  const editLink = resource.getLink("edit");
  assertEquals((editLink as Link).href, "/products/123/edit");
  assertEquals((editLink as Link).method, "PUT");
});
```

## Best Practices

### Resource Design

Guidelines for designing resources:

1. **Meaningful Types**: Choose resource types that reflect domain entities
2. **Consistent IDs**: Use consistent ID formats across resources
3. **Essential Properties**: Include only relevant properties in resources
4. **Comprehensive Links**: Provide links for all possible actions
5. **Embedded Resources**: Embed related resources when they're needed together
6. **Clear States**: Define clear resource states that reflect business logic

```typescript
// Good resource design
const order = HyperDeno.createResource({
  type: "order",
  id: "ORD-12345",
  properties: {
    customer: {
      id: "CUST-789",
      name: "John Doe",
      email: "john@example.com"
    },
    items: [
      {
        product: "PROD-123",
        name: "Widget A",
        quantity: 2,
        unitPrice: 19.99,
        subtotal: 39.98
      },
      {
        product: "PROD-456",
        name: "Widget B",
        quantity: 1,
        unitPrice: 29.99,
        subtotal: 29.99
      }
    ],
    createdAt: "2023-12-01T14:30:00Z",
    subtotal: 69.97,
    tax: 5.60,
    shipping: 8.95,
    total: 84.52,
    status: "pending"
  },
  links: {
    self: "/api/orders/ORD-12345",
    customer: "/api/customers/CUST-789",
    "cancel": "/api/orders/ORD-12345/cancel",
    "payment": "/api/orders/ORD-12345/payment"
  }
});

// Add embedded resources
const items = [
  HyperDeno.createResource({
    type: "orderItem",
    id: "ITEM-1",
    properties: {
      product: "PROD-123",
      name: "Widget A",
      quantity: 2,
      unitPrice: 19.99,
      subtotal: 39.98
    },
    links: {
      self: "/api/orders/ORD-12345/items/ITEM-1",
      product: "/api/products/PROD-123"
    }
  }),
  HyperDeno.createResource({
    type: "orderItem",
    id: "ITEM-2",
    properties: {
      product: "PROD-456",
      name: "Widget B",
      quantity: 1,
      unitPrice: 29.99,
      subtotal: 29.99
    },
    links: {
      self: "/api/orders/ORD-12345/items/ITEM-2",
      product: "/api/products/PROD-456"
    }
  })
];

order.embed("items", items);

// Add state transitions
order.addTransition("pending", "paid", "pay", "/api/orders/ORD-12345/pay", "POST");
order.addTransition("pending", "cancelled", "cancel", "/api/orders/ORD-12345/cancel", "POST");
order.addTransition("paid", "shipped", "ship", "/api/orders/ORD-12345/ship", "POST");
order.addTransition("shipped", "delivered", "deliver", "/api/orders/ORD-12345/deliver", "POST");

// Add HAL-Forms
order.addTemplate("add-item", {
  method: "POST",
  target: "/api/orders/ORD-12345/items",
  title: "Add Item",
  properties: [
    {
      name: "productId",
      type: "text",
      required: true,
      prompt: "Product ID"
    },
    {
      name: "quantity",
      type: "number",
      required: true,
      prompt: "Quantity",
      min: 1
    }
  ]
});
```

### Link Relations

Guidelines for link relations:

1. **Use Standard Relations**: Use standard relation names when applicable
2. **Descriptive Custom Relations**: Choose clear names for custom relations
3. **Link to Actions**: Include links for all available actions
4. **Provide Context**: Use link titles and other metadata when helpful
5. **Link Templates**: Use templates for links with variables

```typescript
// Good link design
resource
  // Standard relations
  .addLink(HyperDeno.STANDARD_RELS.SELF, "/api/products/123")
  .addLink(HyperDeno.STANDARD_RELS.COLLECTION, "/api/products")
  .addLink(HyperDeno.STANDARD_RELS.EDIT, "/api/products/123", "PUT")
  .addLink(HyperDeno.STANDARD_RELS.DELETE, "/api/products/123", "DELETE")
  
  // Descriptive custom relations
  .addLink("review", "/api/products/123/reviews", "POST", {
    title: "Write a Review"
  })
  .addLink("related-products", "/api/products/123/related")
  
  // Action links
  .addLink("add-to-cart", "/api/cart/items", "POST", {
    title: "Add to Cart"
  })
  .addLink("add-to-wishlist", "/api/wishlist/items", "POST", {
    title: "Add to Wishlist"
  })
  
  // Templated links
  .addTemplatedLink("search-similar", "/api/products/search{?category,price,features}", "GET", {
    title: "Search Similar Products"
  });
```

### State Transitions

Guidelines for state transitions:

1. **Clear State Names**: Use clear, descriptive state names
2. **Complete Transitions**: Define all valid transitions
3. **Conditional Logic**: Use conditions for context-dependent transitions
4. **Link to Transitions**: Provide links for available transitions
5. **Validation**: Validate before applying transitions

```typescript
// Good state transition design
const order = HyperDeno.createResource({
  type: "order",
  id: "123",
  properties: {
    customer: "CUST-789",
    total: 84.52,
    paymentMethod: null,
    paymentConfirmed: false
  },
  state: "draft"
});

// Define all possible transitions
order.addTransition("draft", "submitted", "submit", "/api/orders/123/submit", "POST");

// Conditional transitions based on properties
order.addTransition(
  "submitted", "processing", "process", 
  "/api/orders/123/process", "POST",
  { paymentConfirmed: true } // Only available if payment is confirmed
);

order.addTransition(
  "submitted", "cancelled", "cancel", 
  "/api/orders/123/cancel", "POST"
);

order.addTransition(
  "processing", "shipped", "ship", 
  "/api/orders/123/ship", "POST"
);

order.addTransition(
  "shipped", "delivered", "deliver", 
  "/api/orders/123/deliver", "POST"
);

// Handling transition in a route
app.router.post("/api/orders/:id/submit", async (req, params) => {
  const order = await getOrder(params.id);
  
  if (!order) {
    throw new HyperDeno.NotFoundError(`Order ${params.id} not found`);
  }
  
  // Create resource
  const resource = HyperDeno.createResource({
    type: "order",
    id: order.id,
    properties: order,
    state: order.status
  });
  
  // Define transitions
  resource.addTransition("draft", "submitted", "submit", `/api/orders/${order.id}/submit`, "POST");
  resource.addTransition("submitted", "cancelled", "cancel", `/api/orders/${order.id}/cancel`, "POST");
  // Additional transitions...
  
  try {
    // Apply the transition
    resource.applyTransition("submit");
    
    // Update in database
    await updateOrderStatus(order.id, resource.getState());
    
    return resource;
  } catch (err) {
    if (err instanceof HyperDeno.StateTransitionError) {
      throw new HyperDeno.ValidationError(`Cannot submit order: ${err.message}`);
    }
    throw err;
  }
});
```

### Error Handling Best Practices

Guidelines for error handling:

1. **Use Specialized Errors**: Use the right error type for each situation
2. **Include Details**: Add relevant details to error objects
3. **Consistent Handling**: Handle errors consistently across the API
4. **Provide Context**: Include enough context to understand the error
5. **Security Awareness**: Don't leak sensitive information in errors

```typescript
// Good error handling
app.router.post("/api/users", async (req) => {
  try {
    // Validate input
    const data = await HyperDeno.validateBody(req, {
      username: { type: "string", required: true, minLength: 3 },
      email: { type: "string", required: true, pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
      password: { type: "string", required: true, minLength: 8 }
    });
    
    // Check if user exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      throw new HyperDeno.ValidationError("User already exists", "USER_EXISTS", {
        field: "email",
        value: data.email
      });
    }
    
    // Create user (could throw database errors)
    const user = await createUser(data);
    
    // Return resource
    return HyperDeno.createResource({
      type: "user",
      id: user.id,
      properties: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    // Handle expected error types
    if (err instanceof HyperDeno.ValidationError) {
      return HyperDeno.createErrorResponse(err);
    }
    
    // Log unexpected errors
    console.error("Error creating user:", err);
    
    // Return generic error for unexpected errors
    return HyperDeno.createErrorResponse(
      new HyperDeno.ServerError("Failed to create user")
    );
  }
});
```

## Examples

### Blog API

A complete blog API example:

```typescript
import HyperDeno from "./hyperdeno.ts";

// Create application
const app = HyperDeno.createApp({ port: 3000 });

// Create in-memory database
const db = {
  posts: [
    { id: "1", title: "Hello World", content: "This is my first post", author: "1", published: true, createdAt: "2023-12-01T12:00:00Z" },
    { id: "2", title: "HATEOAS Explained", content: "Let me explain HATEOAS...", author: "1", published: true, createdAt: "2023-12-02T14:30:00Z" }
  ],
  authors: [
    { id: "1", name: "John Doe", email: "john@example.com", bio: "Tech blogger" }
  ],
  comments: [
    { id: "1", post: "1", author: "2", content: "Great post!", createdAt: "2023-12-01T14:00:00Z" }
  ]
};

// Define post resource
app.defineResource("post", {
  schema: {
    fields: {
      title: { type: "string", required: true },
      content: { type: "string", required: true },
      author: { type: "string", required: true },
      published: { type: "boolean", default: false }
    }
  },
  routes: {
    base: "/api/posts",
    
    // List all posts
    list: async (req) => {
      return db.posts.filter(post => post.published);
    },
    
    // Get a single post
    get: async (req, id) => {
      const post = db.posts.find(p => p.id === id);
      if (!post) {
        throw new HyperDeno.NotFoundError(`Post ${id} not found`);
      }
      return post;
    },
    
    // Create a new post
    create: async (req, data) => {
      const id = (db.posts.length + 1).toString();
      const post = {
        id,
        ...data,
        createdAt: new Date().toISOString()
      };
      db.posts.push(post);
      return post;
    },
    
    // Update a post
    update: async (req, id, data) => {
      const index = db.posts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new HyperDeno.NotFoundError(`Post ${id} not found`);
      }
      
      const post = {
        ...db.posts[index],
        ...data,
        id
      };
      
      db.posts[index] = post;
      return post;
    },
    
    // Delete a post
    delete: async (req, id) => {
      const index = db.posts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new HyperDeno.NotFoundError(`Post ${id} not found`);
      }
      
      db.posts.splice(index, 1);
    }
  },
  
  // Transform data before creating resources
  transform: (data) => {
    const post = { ...data as Record<string, unknown> };
    
    // Ensure boolean for published
    if (typeof post.published === 'string') {
      post.published = post.published === 'true' || post.published === '1';
    }
    
    return post;
  }
});

// Define author resource
app.defineResource("author", {
  schema: {
    fields: {
      name: { type: "string", required: true },
      email: { type: "string", required: true },
      bio: { type: "string" }
    }
  },
  routes: {
    base: "/api/authors",
    
    // List all authors
    list: async (req) => {
      return db.authors;
    },
    
    // Get a single author
    get: async (req, id) => {
      const author = db.authors.find(a => a.id === id);
      if (!author) {
        throw new HyperDeno.NotFoundError(`Author ${id} not found`);
      }
      return author;
    }
    
    // Other handlers omitted for brevity
  }
});

// Custom route for API root
app.router.get("/api", (req) => {
  return HyperDeno.createResource({
    type: "api",
    properties: {
      name: "Blog API",
      version: "1.0.0"
    },
    links: {
      self: "/api",
      posts: "/api/posts",
      authors: "/api/authors"
    }
  });
});

// Custom route for author's posts
app.router.get("/api/authors/:id/posts", (req, params) => {
  const authorId = params.id;
  
  // Check if author exists
  const author = db.authors.find(a => a.id === authorId);
  if (!author) {
    throw new HyperDeno.NotFoundError(`Author ${authorId} not found`);
  }
  
  // Get author's posts
  const posts = db.posts.filter(p => p.author === authorId && p.published);
  
  // Create collection
  const collection = HyperDeno.createCollection({
    type: "posts",
    items: posts.map(post => 
      HyperDeno.createResource({
        type: "post",
        id: post.id,
        properties: post,
        links: {
          self: `/api/posts/${post.id}`,
          author: `/api/authors/${post.author}`
        }
      })
    ),
    links: {
      self: `/api/authors/${authorId}/posts`,
      author: `/api/authors/${authorId}`
    }
  });
  
  return collection;
});

// Register resource routes
app.registerResources();

// Start the server
await app.start();
```

### E-commerce API

A more complete example is available in the [examples directory](./examples/e-commerce-api.ts).

### Task Management API

Another example can be found in the [examples directory](./examples/task-management-api.ts).

## API Reference

For a complete API reference, please visit the [API documentation](./API.md).

## Examples

For more examples, check out the [examples directory](./examples/).
