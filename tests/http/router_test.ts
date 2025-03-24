import { assertEquals, assertExists, assertThrows } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { Router, HTTP_METHODS } from "../../hyperdeno/http/router.ts";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { Collection } from "../../hyperdeno/core/collection.ts";
import { createResponse } from "../../hyperdeno/http/response.ts";
import { NotFoundError } from "../../hyperdeno/core/errors.ts";

Deno.test("Router Creation and Management", async (t) => {
  await t.step("should create router", () => {
    const router = new Router();
    assertExists(router);
  });

  await t.step("should handle basic route", async () => {
    const router = new Router();
    router.get("/test", () => new Response("Test"));

    const request = new Request("http://localhost:8000/test");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 200);
    assertEquals(text, "Test");
  });

  await t.step("should handle route parameters", async () => {
    const router = new Router();
    router.get("/users/:id", (request, params) => {
      return new Response(params.id);
    });

    const request = new Request("http://localhost:8000/users/123");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 200);
    assertEquals(text, "123");
  });

  await t.step("should handle multiple route parameters", async () => {
    const router = new Router();
    router.get("/users/:userId/posts/:postId", (request, params) => {
      return new Response(JSON.stringify(params));
    });

    const request = new Request("http://localhost:8000/users/123/posts/456");
    const response = await router.handle(request);
    const params = await response.json();

    assertEquals(response.status, 200);
    assertEquals(params.userId, "123");
    assertEquals(params.postId, "456");
  });

  await t.step("should handle different HTTP methods", async () => {
    const router = new Router();
    const methods = Object.values(HTTP_METHODS);

    methods.forEach(method => {
      router.route(method, "/test", () => new Response(method));
    });

    for (const method of methods) {
      const request = new Request("http://localhost:8000/test", { method });
      const response = await router.handle(request);
      const text = await response.text();

      assertEquals(response.status, 200);
      assertEquals(text, method);
    }
  });

  await t.step("should handle method shortcuts", async () => {
    const router = new Router();

    router.get("/test", () => new Response("GET"));
    router.post("/test", () => new Response("POST"));
    router.put("/test", () => new Response("PUT"));
    router.patch("/test", () => new Response("PATCH"));
    router.delete("/test", () => new Response("DELETE"));
    router.options("/test", () => new Response("OPTIONS"));
    router.head("/test", () => new Response("HEAD"));

    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
    for (const method of methods) {
      const request = new Request("http://localhost:8000/test", { method });
      const response = await router.handle(request);
      const text = await response.text();

      assertEquals(response.status, 200);
      assertEquals(text, method);
    }
  });

  await t.step("should handle resource routes", async () => {
    const router = new Router();

    router.resource("/articles", {
      list: () => {
        const articles = [
          new Resource({ type: "article", id: "1" }),
          new Resource({ type: "article", id: "2" })
        ];
        const collection = new Collection({ type: "articles", items: articles });
        return createResponse(collection);
      },
      get: (request, params) => {
        const article = new Resource({ 
          type: "article", 
          id: params.id,
          properties: { title: "Test Article" }
        });
        return createResponse(article);
      },
      create: () => {
        const article = new Resource({ 
          type: "article", 
          id: "new",
          properties: { title: "New Article" }
        });
        return createResponse(article, { status: 201 });
      },
      update: (request, params) => {
        const article = new Resource({ 
          type: "article", 
          id: params.id,
          properties: { title: "Updated Article" }
        });
        return createResponse(article);
      },
      delete: () => {
        return new Response(null, { status: 204 });
      }
    });

    // Test list
    let request = new Request("http://localhost:8000/articles");
    let response = await router.handle(request);
    let json = await response.json();
    assertEquals(response.status, 200);
    assertEquals(json.type, "articles");
    assertEquals(json.items.length, 2);

    // Test get
    request = new Request("http://localhost:8000/articles/1");
    response = await router.handle(request);
    json = await response.json();
    assertEquals(response.status, 200);
    assertEquals(json.type, "article");
    assertEquals(json.id, "1");

    // Test create
    request = new Request("http://localhost:8000/articles", { method: "POST" });
    response = await router.handle(request);
    json = await response.json();
    assertEquals(response.status, 201);
    assertEquals(json.type, "article");
    assertEquals(json.id, "new");

    // Test update
    request = new Request("http://localhost:8000/articles/1", { method: "PUT" });
    response = await router.handle(request);
    json = await response.json();
    assertEquals(response.status, 200);
    assertEquals(json.type, "article");
    assertEquals(json.id, "1");
    assertEquals(json.properties.title, "Updated Article");

    // Test delete
    request = new Request("http://localhost:8000/articles/1", { method: "DELETE" });
    response = await router.handle(request);
    assertEquals(response.status, 204);
  });

  await t.step("should handle not found routes", async () => {
    const router = new Router();

    const request = new Request("http://localhost:8000/not-found");
    const response = await router.handle(request);
    const json = await response.json();

    assertEquals(response.status, 404);
    assertEquals(json.error, "Route not found: GET http://localhost:8000/not-found");
  });

  await t.step("should handle custom not found handler", async () => {
    const router = new Router();
    router.setNotFoundHandler(() => {
      return new Response("Custom Not Found", { status: 404 });
    });

    const request = new Request("http://localhost:8000/not-found");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 404);
    assertEquals(text, "Custom Not Found");
  });

  await t.step("should handle errors", async () => {
    const router = new Router();
    router.get("/error", () => {
      throw new Error("Test Error");
    });

    const request = new Request("http://localhost:8000/error");
    const response = await router.handle(request);
    const json = await response.json();

    assertEquals(response.status, 500);
    assertEquals(json.error, "Test Error");
  });

  await t.step("should handle custom error handler", async () => {
    const router = new Router();
    router.setErrorHandler((error) => {
      return new Response(`Custom Error: ${error.message}`, { status: 500 });
    });

    router.get("/error", () => {
      throw new Error("Test Error");
    });

    const request = new Request("http://localhost:8000/error");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 500);
    assertEquals(text, "Custom Error: Test Error");
  });

  await t.step("should handle regex routes", async () => {
    const router = new Router();
    router.get(/^\/test\/\d+$/, () => new Response("Regex Route"));

    const request = new Request("http://localhost:8000/test/123");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 200);
    assertEquals(text, "Regex Route");
  });

  await t.step("should handle catch-all routes", async () => {
    const router = new Router();
    router.all("*", () => new Response("Catch All"));

    const request = new Request("http://localhost:8000/any/path");
    const response = await router.handle(request);
    const text = await response.text();

    assertEquals(response.status, 200);
    assertEquals(text, "Catch All");
  });
}); 