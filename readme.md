# HyperDeno

A HATEOAS (Hypermedia as the Engine of Application State) framework for building hypermedia-driven APIs using Deno 2.

## Features

- **Pure Web Standards**: Built on web standard Request/Response objects
- **HATEOAS Resources**: First-class support for hypermedia resources and links
- **JSON-First**: Simple and consistent JSON-based HATEOAS format
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

### JSON Response Format

All resources are rendered as JSON with HATEOAS links and embedded resources:

```json
{
  "type": "user",
  "properties": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "_links": {
    "self": { "href": "/api/users/123" },
    "edit": { "href": "/api/users/123", "method": "PUT" },
    "delete": { "href": "/api/users/123", "method": "DELETE" }
  },
  "_embedded": {
    "orders": [
      {
        "type": "order",
        "properties": { "id": "789", "total": 99.99 },
        "_links": {
          "self": { "href": "/api/orders/789" }
        }
      }
    ]
  }
}
```

## Modules

### Core

- **Resource**: Base hypermedia resource class
- **Collection**: Resource collection with pagination
- **LinkManager**: Handles hypermedia links
- **ResourceState**: Manages resource state transitions
- **Errors**: Standardized error types
- **JsonRenderer**: JSON response renderer

### HTTP

- **Router**: Web standard router
- **Request**: Request parsing and validation
- **Response**: Response creation helpers

### Util

- **Validation**: Request validation utilities

## Full Documentation

Visit our [full documentation](https://yourusername.github.io/hyperdeno/) for detailed API reference, guides, and examples.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.