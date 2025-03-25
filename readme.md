# HyperDeno

A powerful, flexible HATEOAS framework for building hypermedia-driven APIs with Deno.

![HyperDeno Logo](https://via.placeholder.com/200x200.png?text=HyperDeno)

## 🚀 Overview

HyperDeno is a modern framework for building RESTful APIs that fully embrace HATEOAS (Hypermedia as the Engine of Application State) principles. It provides a clean, resource-first approach to API design, with built-in support for hypermedia controls, state transitions, and content negotiation.

```typescript
import HyperDeno from "./hyperdeno.ts";

// Create a simple API
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
    list: async () => [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" }
    ],
    get: async (req, id) => ({ id, name: "Alice", email: "alice@example.com" })
  }
});

// Register routes and start
app.registerResources();
await app.start();
```

## ✨ Key Features

- **Full HATEOAS Support**: Resources with links, embedded resources, and state transitions
- **HAL-Forms**: Describe actions with forms for rich hypermedia interactions
- **Resource Definition System**: Declarative resource definitions with automatic routing
- **Content Negotiation**: Support for multiple content types (JSON, HAL+JSON, Plain Text, etc.)
- **State Machine**: Built-in state transitions for resources
- **Middleware System**: Flexible request processing pipeline
- **Plugin Architecture**: Extend the framework with plugins
- **Event System**: React to framework events with an event emitter
- **Configurable**: Extensive configuration options

## 📦 Installation

```bash
# Import directly from URL
import HyperDeno from "https://raw.githubusercontent.com/yourusername/hyperdeno/main/hyperdeno.ts";

# Or download and import locally
curl -o hyperdeno.ts https://raw.githubusercontent.com/yourusername/hyperdeno/main/hyperdeno.ts
import HyperDeno from "./hyperdeno.ts";
```

## 🏗️ Basic Usage

### Creating Resources

```typescript
// Create a resource with the factory function
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
  }
});

// Or use the Resource class directly
const product = new HyperDeno.Resource({
  type: "product",
  id: "456"
});

product.setProperty("name", "Awesome Widget");
product.setProperty("price", 19.99);
product.addLink("self", "/api/products/456");
```

### Creating Collections

```typescript
// Create a collection with resources
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
  }
});

// Add pagination links
users.addPaginationLinks("/api/users");
```

### Defining Resource Types

```typescript
// Define a resource type with schema and routes
app.defineResource("product", {
  schema: {
    fields: {
      name: { type: "string", required: true },
      price: { type: "number", required: true, min: 0 },
      description: { type: "string" },
      inStock: { type: "boolean", default: true }
    }
  },
  routes: {
    base: "/api/products",
    
    // GET /api/products
    list: async (req) => {
      return [
        { id: "1", name: "Widget A", price: 19.99 },
        { id: "2", name: "Widget B", price: 29.99 }
      ];
    },
    
    // GET /api/products/:id
    get: async (req, id) => {
      return { id, name: "Widget A", price: 19.99 };
    },
    
    // POST /api/products
    create: async (req, data) => {
      console.log("Creating product:", data);
      return { id: "3", ...data };
    },
    
    // PUT /api/products/:id
    update: async (req, id, data) => {
      console.log(`Updating product ${id}:`, data);
      return { id, ...data };
    },
    
    // DELETE /api/products/:id
    delete: async (req, id) => {
      console.log(`Deleting product ${id}`);
    }
  }
});
```

### Setting Up Routes

```typescript
// Register all resource routes
app.registerResources();

// Or define custom routes
app.router.get("/api", () => {
  return HyperDeno.createResource({
    type: "api",
    properties: {
      name: "My API",
      version: "1.0.0"
    },
    links: {
      self: "/api",
      products: "/api/products",
      users: "/api/users"
    }
  });
});
```

## 🔌 Extensions

### Adding Middleware

```typescript
// Add logging middleware
app.use(async (request, context, next) => {
  console.log(`Request: ${request.method} ${request.url}`);
  const start = performance.now();
  
  // Process the request
  const response = await next();
  
  const duration = performance.now() - start;
  console.log(`Response: ${response.status} (${duration.toFixed(2)}ms)`);
  
  return response;
});
```

### Creating Plugins

```typescript
// Create a plugin
const myPlugin = {
  name: "my-plugin",
  
  // Initialize when registered
  initialize: (app) => {
    console.log("Plugin initialized");
  },
  
  // Register hooks
  hooks: {
    [HyperDeno.HookType.BEFORE_ROUTE_HANDLE]: (request) => {
      console.log(`Processing route: ${request.method} ${request.url}`);
    }
  },
  
  // Add middleware
  middlewares: [
    async (request, context, next) => {
      // Add request ID
      const requestId = crypto.randomUUID();
      context.state.requestId = requestId;
      
      const response = await next();
      
      // Add header to response
      const headers = new Headers(response.headers);
      headers.set("X-Request-ID", requestId);
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
    }
  ]
};

// Register the plugin
app.registerPlugin(myPlugin);
```

### Custom Renderers

```typescript
// Create a custom renderer
class XmlRenderer implements HyperDeno.ResourceRenderer {
  mediaType = "application/xml";
  
  canRender(resource) {
    return true; // Can render any resource
  }
  
  render(resource, options = {}) {
    const xml = this.toXml(resource.toJSON());
    
    return new Response(xml, {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/xml',
        ...options.headers
      }
    });
  }
  
  private toXml(json) {
    // XML conversion logic here
    return `<resource>...</resource>`;
  }
}

// Register the renderer
app.registerRenderer(new XmlRenderer());
```

### Event Handling

```typescript
// Listen for framework events
app.on(HyperDeno.FrameworkEvent.SERVER_START, (data) => {
  console.log(`Server started on port ${data.port}`);
});

app.on(HyperDeno.FrameworkEvent.REQUEST_END, (data) => {
  console.log(`Request to ${data.request.url} completed with status ${data.response.status}`);
});

// Create and emit custom events
const emitter = app.server.getEventEmitter();
emitter.on('product:viewed', (product) => {
  console.log(`Product ${product.id} was viewed`);
});

emitter.emit('product:viewed', { id: '123', name: 'Widget' });
```

## 📖 Further Reading

For a comprehensive guide to HyperDeno's features and API, see the [full documentation](./DOCUMENTATION.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

Copyright (c) 2025 Radu Alexandru Cosmin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.