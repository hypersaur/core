/**
 * Basic HyperDeno Server Example
 * 
 * This example demonstrates how to create a simple HATEOAS API
 * using the HyperDeno framework.
 */

// Import from the JSR package (in a real app)
// import { createApp, Resource, Collection } from "jsr:@yourusername/hyperdeno";

// For local development, import from the local module
import { createApp, createServer, Resource, Collection, type PathParams } from "../mod.ts";
import { createResponse } from "../hyperdeno/http/response.ts";

interface ServerOptions {
  port: number;
  hostname: string;
  onListen: (params: { hostname: string; port: number }) => void;
}

// Create the server
const server = createServer({
  port: 3000,
  hostname: "localhost",
  onListen: ({ hostname, port }: { hostname: string; port: number }) => {
    console.log(`🚀 Server running at http://${hostname}:${port}/`);
  },
});

// Create the application
const app = createApp();

// Set up the API root
app.getRouter().get("/api", (_request: Request) => {
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
  
  return createResponse(resource);
});

// Set up a collection resource
app.getRouter().get("/api/users", (_request: Request) => {
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
  
  return createResponse(collection);
});

// Set up an individual resource
app.getRouter().get("/api/users/:id", (_request: Request, params: PathParams) => {
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
  
  return createResponse(resource);
});

// Set the app's router on the server
server.getRouter().get("*", (request) => {
  return app.handle(request);
});

// Start the server
await server.start(); 