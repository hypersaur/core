import { assertEquals, assertExists } from "jsr:@std/assert";
import { Server } from "../hyperdeno/server.ts";
import { Resource } from "../hyperdeno/core/resource.ts";
import { Collection } from "../hyperdeno/core/collection.ts";
import { RendererFactory } from "../hyperdeno/rendering/renderer_factory.ts";
import { createResponse } from "../hyperdeno/http/response.ts";

Deno.test("Server Creation and Management", async (t) => {
  await t.step("should create server with default options", () => {
    const server = new Server();
    assertExists(server);
    assertExists(server.getRouter());
    assertExists(server.getRendererFactory());
  });

  await t.step("should create server with custom options", () => {
    const server = new Server({
      port: 3000,
      hostname: "127.0.0.1",
      rendererFactory: new RendererFactory()
    });
    assertExists(server);
    assertExists(server.getRouter());
    assertExists(server.getRendererFactory());
  });

  await t.step("should handle basic routing", async () => {
    const server = new Server();
    const router = server.getRouter();

    router.get("/", () => {
      return new Response("Hello World");
    });

    const request = new Request("http://localhost:8000/");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 200);
    assertEquals(text, "Hello World");
  });

  await t.step("should handle resource routing", async () => {
    const server = new Server();
    const router = server.getRouter();
    
    router.get("/articles/:id", (_request: Request, params: Record<string, string>) => {
      const article = new Resource({ 
        type: "article", 
        id: params.id,
        properties: { title: "Test Article" }
      });
      return createResponse(article);
    });
    
    const request = new Request("http://localhost:8000/articles/1");
    const response = await router.handle(request);
    const json = await response.json();
    assertEquals(response.status, 200);
    assertEquals(json.type, "article");
    assertEquals(json.properties.title, "Test Article");
  });

  await t.step("should handle collection routing", async () => {
    const server = new Server();
    const router = server.getRouter();
    
    router.get("/articles", () => {
      const articles = [
        new Resource({ type: "article", id: "1", properties: { title: "Article 1" } }),
        new Resource({ type: "article", id: "2", properties: { title: "Article 2" } })
      ];
      const collection = new Collection({ type: "articles", items: articles });
      return createResponse(collection);
    });
    
    const request = new Request("http://localhost:8000/articles");
    const response = await router.handle(request);
    const json = await response.json();
    assertEquals(response.status, 200);
    assertEquals(json.type, "articles");
    assertEquals(json.embedded.items.length, 2);
  });

  await t.step("should handle error responses", async () => {
    const server = new Server();
    const router = server.getRouter();
    
    router.get("/error", () => {
      throw new Error("Test Error");
    });
    
    const request = new Request("http://localhost:8000/error");
    const response = await server.handle(request);
    const json = await response.json();
    assertEquals(response.status, 500);
    assertEquals(json.status, 500);
    assertEquals(json.code, "INTERNAL_ERROR");
    assertEquals(json.message, "Test Error");
  });

  await t.step("should handle different HTTP methods", async () => {
    const server = new Server();
    const router = server.getRouter();

    router.get("/resource", () => new Response("GET"));
    router.post("/resource", () => new Response("POST"));
    router.put("/resource", () => new Response("PUT"));
    router.delete("/resource", () => new Response("DELETE"));

    const methods = ["GET", "POST", "PUT", "DELETE"];
    for (const method of methods) {
      const request = new Request("http://localhost:8000/resource", { method });
      const response = await router.handle(request);
      const text = await response.text();
      assertEquals(text, method);
    }
  });

  await t.step("should handle route parameters", async () => {
    const server = new Server();
    const router = server.getRouter();

    router.get("/users/:userId/posts/:postId", (_request, params) => {
      return new Response(JSON.stringify(params));
    });

    const request = new Request("http://localhost:8000/users/123/posts/456");
    const response = await router.handle(request);
    const params = await response.json();

    assertEquals(params.userId, "123");
    assertEquals(params.postId, "456");
  });

  await t.step("should handle query parameters", async () => {
    const server = new Server();
    const router = server.getRouter();

    router.get("/search", (request) => {
      const url = new URL(request.url);
      return new Response(url.searchParams.get("q"));
    });

    const request = new Request("http://localhost:8000/search?q=test");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(text, "test");
  });

  await t.step("should handle request headers", async () => {
    const server = new Server();
    const router = server.getRouter();

    router.get("/headers", (request) => {
      return new Response(null, {
        headers: {
          "X-Custom-Header": request.headers.get("X-Custom-Header") || ""
        }
      });
    });

    const request = new Request("http://localhost:8000/headers", {
      headers: { "X-Custom-Header": "test-value" }
    });
    const response = await router.handle(request);

    assertEquals(response.headers.get("X-Custom-Header"), "test-value");
  });

  await t.step("should handle response content types", async () => {
    const server = new Server();
    const router = server.getRouter();

    router.get("/json", () => {
      return new Response(JSON.stringify({ test: true }), {
        headers: { "Content-Type": "application/json" }
      });
    });

    const request = new Request("http://localhost:8000/json");
    const response = await router.handle(request);

    assertEquals(response.headers.get("Content-Type"), "application/json");
    const json = await response.json();
    assertEquals(json.test, true);
  });
}); 