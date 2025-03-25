import { assertEquals, assertExists, assertThrows } from "jsr:@std/assert";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { InvalidArgumentError } from "../../hyperdeno/core/errors.ts";
import { StateTransitionError } from "../../hyperdeno/core/errors.ts";

Deno.test("Resource Creation and Initialization", async (t) => {
  await t.step("should create an empty resource", () => {
    const resource = new Resource();
    const json = resource.toJSON();
    assertEquals(json.type, "");
    assertEquals(json.id, "");
    assertEquals(json.properties, {});
  });

  await t.step("should create a resource with type and id", () => {
    const resource = new Resource({ type: "article", id: "123" });
    const json = resource.toJSON();
    assertEquals(json.type, "article");
    assertEquals(json.id, "123");
    assertEquals(json.properties, {});
  });

  await t.step("should create a resource with properties", () => {
    const resource = new Resource({ 
      type: "article", 
      id: "123",
      properties: { title: "Test Article" }
    });
    const json = resource.toJSON();
    assertEquals(json.type, "article");
    assertEquals(json.id, "123");
    assertEquals(json.properties, { title: "Test Article" });
  });

  await t.step("should create a resource with initial links", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("self", "/articles/123");
    const link = resource.getLink("self");
    assertExists(link);
    if (!Array.isArray(link)) {
      assertEquals(link.href, "/articles/123");
      assertEquals(link.rel, "self");
    }
  });

  await t.step("should handle complex initialization", () => {
    const resource = new Resource({ 
      type: "article", 
      id: "123",
      properties: { title: "Test Article" }
    });
    resource.addLink("self", "/articles/123");
    resource.addTransition("draft", "published", "publish", "/articles/123/publish", "POST");
    resource.applyTransition("publish");
    
    const json = resource.toJSON();
    assertEquals(json.type, "article");
    assertEquals(json.id, "123");
    assertEquals(json.properties, { title: "Test Article" });
    const link = resource.getLink("self");
    assertExists(link);
    if (!Array.isArray(link)) {
      assertEquals(link.href, "/articles/123");
      assertEquals(link.rel, "self");
    }
    assertEquals(json.state, "published");
  });
});

Deno.test("Resource Properties Management", async (t) => {
  await t.step("should set and get single property", () => {
    const resource = new Resource();
    resource.setProperty("name", "Test Resource");
    assertEquals(resource.getProperty("name"), "Test Resource");
  });

  await t.step("should update existing property", () => {
    const resource = new Resource();
    resource.setProperty("name", "Original Name");
    resource.setProperty("name", "Updated Name");
    assertEquals(resource.getProperty("name"), "Updated Name");
  });

  await t.step("should handle null and undefined properties", () => {
    const resource = new Resource();
    resource.setProperty("nullValue", null);
    resource.setProperty("undefinedValue", undefined);
    assertEquals(resource.getProperty("nullValue"), null);
    assertEquals(resource.getProperty("undefinedValue"), undefined);
  });

  await t.step("should throw error for invalid property key", () => {
    const resource = new Resource();
    assertThrows(
      () => resource.setProperty("", "value"),
      InvalidArgumentError,
      "Property key must be a string"
    );
    assertThrows(
      () => resource.setProperty(null as unknown as string, "value"),
      InvalidArgumentError,
      "Property key must be a string"
    );
    assertThrows(
      () => resource.setProperty(undefined as unknown as string, "value"),
      InvalidArgumentError,
      "Property key must be a string"
    );
  });

  await t.step("should handle nested property updates", () => {
    const resource = new Resource();
    resource.setProperty("metadata", { created: "2024-01-01" });
    resource.setProperty("metadata.updated", "2024-01-02");
    assertEquals(resource.getProperty("metadata"), { created: "2024-01-01", updated: "2024-01-02" });
  });

  await t.step("should return undefined for non-existent property", () => {
    const resource = new Resource();
    assertEquals(resource.getProperty("nonExistent"), undefined);
  });
});

Deno.test("Resource Link Management", async (t) => {
  await t.step("should add and get links", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("self", "/articles/123");
    
    const link = resource.getLink("self");
    assertExists(link);
    if (!Array.isArray(link)) {
      assertEquals(link.href, "/articles/123");
    }
  });

  await t.step("should handle multiple links with same relation", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("author", "/authors/1");
    resource.addLink("author", "/authors/2");
    
    const links = resource.getLink("author");
    assertExists(links);
    if (Array.isArray(links)) {
      assertEquals(links.length, 2);
      assertEquals(links[0].href, "/authors/1");
      assertEquals(links[1].href, "/authors/2");
    }
  });

  await t.step("should handle link options", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("edit", "/articles/123/edit", "PUT", {
      title: "Edit Article",
      type: "application/json"
    });
    
    const link = resource.getLink("edit");
    assertExists(link);
    if (!Array.isArray(link)) {
      assertEquals(link.href, "/articles/123/edit");
      assertEquals(link.method, "PUT");
      assertEquals(link.title, "Edit Article");
      assertEquals(link.type, "application/json");
    }
  });

  await t.step("should handle templated links", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addTemplatedLink("search", "/articles/search?q={query}");
    
    const link = resource.getLink("search");
    assertExists(link);
    if (!Array.isArray(link)) {
      assertEquals(link.href, "/articles/search?q={query}");
      assertEquals(link.templated, true);
    }
  });

  await t.step("should get self link", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("self", "/articles/123");
    assertEquals(resource.getSelfLink(), "/articles/123");
  });

  await t.step("should handle multiple self links", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("self", "/articles/123");
    resource.addLink("self", "/articles/123/v2");
    assertEquals(resource.getSelfLink(), "/articles/123");
  });

  await t.step("should remove links", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("self", "/articles/123");
    resource.removeLink("self");
    assertEquals(resource.getLink("self"), undefined);
  });
});

Deno.test("Resource State Management", async (t) => {
  await t.step("should add and apply state transitions", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addTransition("draft", "published", "publish", "/articles/123/publish", "POST");
    const transitions = resource.getAvailableTransitions();
    assertEquals(transitions.length, 1);
    assertEquals(transitions[0].name, "publish");
    resource.applyTransition("publish");
    const json = resource.toJSON();
    assertEquals(json.state, "published");
  });

  await t.step("should handle conditional transitions", () => {
    const resource = new Resource({ 
      type: "article", 
      id: "123",
      properties: { ready: true }
    });
    resource.addTransition(
      "draft", 
      "published", 
      "publish", 
      "/articles/123/publish", 
      "POST",
      { ready: true }
    );
    const transitions = resource.getAvailableTransitions();
    assertEquals(transitions.length, 1);
    assertEquals(transitions[0].name, "publish");
  });

  await t.step("should handle multiple transitions", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addTransition("draft", "review", "submit", "/articles/123/submit", "POST");
    resource.addTransition("review", "published", "approve", "/articles/123/approve", "POST");
    const transitions = resource.getAvailableTransitions();
    assertEquals(transitions.length, 1);
    assertEquals(transitions[0].name, "submit");
    resource.applyTransition("submit");
    const newTransitions = resource.getAvailableTransitions();
    assertEquals(newTransitions.length, 1);
    assertEquals(newTransitions[0].name, "approve");
  });
});

Deno.test("Resource JSON Serialization", async (t) => {
  await t.step("should serialize basic resource", () => {
    const resource = new Resource({ 
      type: "article", 
      id: "123",
      properties: { title: "Test Article" }
    });
    const json = resource.toJSON();
    assertEquals(json.type, "article");
    assertEquals(json.id, "123");
    assertEquals(json.properties, { title: "Test Article" });
  });

  await t.step("should serialize resource with links", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addLink("self", "/articles/123");
    const json = resource.toJSON();
    assertExists(json.links);
    const links = json.links as Record<string, { href: string }>;
    assertEquals(links.self.href, "/articles/123");
  });

  await t.step("should serialize resource with embedded resources", () => {
    const resource = new Resource({ type: "article", id: "123" });
    const author = new Resource({ type: "author", id: "1" });
    resource.embed("author", author);
    const json = resource.toJSON();
    assertExists(json.embedded);
    const embedded = json.embedded as Record<string, Array<{ type: string; id: string }>>;
    assertEquals(embedded.author[0].type, "author");
    assertEquals(embedded.author[0].id, "1");
  });

  await t.step("should serialize resource with state", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.addTransition("draft", "published", "publish", "/articles/123/publish", "POST");
    resource.applyTransition("publish");
    const json = resource.toJSON();
    assertEquals(json.state, "published");
  });
}); 