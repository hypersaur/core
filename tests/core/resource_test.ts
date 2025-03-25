import { assertEquals, assertExists, assertThrows } from "jsr:@std/assert";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { InvalidArgumentError } from "../../hyperdeno/core/errors.ts";
import { StateTransitionError } from "../../hyperdeno/core/errors.ts";

Deno.test("Resource Creation and Initialization", async (t) => {
  await t.step("should create an empty resource", () => {
    const resource = new Resource();
    assertEquals(resource.getType(), "");
    assertEquals(resource.getId(), "");
    assertEquals(resource.getProperties(), {});
  });

  await t.step("should create a resource with type and id", () => {
    const resource = new Resource({ type: "article", id: "123" });
    assertEquals(resource.getType(), "article");
    assertEquals(resource.getId(), "123");
    assertEquals(resource.getProperties(), {});
  });

  await t.step("should create a resource with properties", () => {
    const resource = new Resource({ 
      type: "article", 
      id: "123",
      properties: { title: "Test Article" }
    });
    assertEquals(resource.getType(), "article");
    assertEquals(resource.getId(), "123");
    assertEquals(resource.getProperties(), { title: "Test Article" });
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

  await t.step("should create a resource with initial state", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    assertEquals(resource.getState(), "draft");
  });

  await t.step("should handle complex initialization", () => {
    const resource = new Resource({ 
      type: "article", 
      id: "123",
      properties: { title: "Test Article" }
    });
    resource.addLink("self", "/articles/123");
    resource.setState("draft");
    
    assertEquals(resource.getType(), "article");
    assertEquals(resource.getId(), "123");
    assertEquals(resource.getProperties(), { title: "Test Article" });
    const link = resource.getLink("self");
    assertExists(link);
    if (!Array.isArray(link)) {
      assertEquals(link.href, "/articles/123");
      assertEquals(link.rel, "self");
    }
    assertEquals(resource.getState(), "draft");
  });
});

Deno.test("Resource Properties Management", async (t) => {
  await t.step("should set and get single property", () => {
    const resource = new Resource();
    resource.setProperty("name", "Test Resource");
    assertEquals(resource.getProperty("name"), "Test Resource");
  });

  await t.step("should set and get multiple properties", () => {
    const resource = new Resource();
    const properties = {
      name: "Test Resource",
      value: 42,
      tags: ["test", "example"],
      metadata: { created: "2024-01-01" }
    };
    resource.setProperties(properties);
    assertEquals(resource.getProperties(), properties);
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

  await t.step("should throw error for invalid properties object", () => {
    const resource = new Resource();
    assertThrows(
      () => resource.setProperties(null as unknown as Record<string, unknown>),
      InvalidArgumentError,
      "Properties must be an object"
    );
    assertThrows(
      () => resource.setProperties(undefined as unknown as Record<string, unknown>),
      InvalidArgumentError,
      "Properties must be an object"
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
});

Deno.test("Resource State Management", async (t) => {
  await t.step("should set and get state", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    assertEquals(resource.getState(), "draft");
  });

  await t.step("should handle state transitions", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    
    resource.addTransition(
      "draft",
      "published",
      "publish",
      "/articles/123/publish",
      "POST"
    );
    
    const transitions = resource.getAvailableTransitions();
    assertEquals(transitions.length, 1);
    assertEquals(transitions[0].name, "publish");
  });

  await t.step("should handle transition conditions", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    
    resource.addTransition(
      "draft",
      "published",
      "publish",
      "/articles/123/publish",
      "POST",
      { title: { exists: true } }
    );
    
    resource.setProperty("title", "Test Article");
    const transitions = resource.getAvailableTransitions();
    assertEquals(transitions.length, 1);
    assertEquals(transitions[0].name, "publish");
  });

  await t.step("should handle invalid transitions", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    
    resource.addTransition(
      "published",
      "draft",
      "unpublish",
      "/articles/123/unpublish",
      "POST"
    );
    
    const transitions = resource.getAvailableTransitions();
    assertEquals(transitions.length, 0);
  });

  await t.step("should apply valid transitions", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    
    resource.addTransition(
      "draft",
      "published",
      "publish",
      "/articles/123/publish",
      "POST"
    );
    
    resource.applyTransition("publish");
    assertEquals(resource.getState(), "published");
  });

  await t.step("should throw error for invalid transition", () => {
    const resource = new Resource({ type: "article", id: "123" });
    resource.setState("draft");
    
    assertThrows(
      () => resource.applyTransition("publish"),
      StateTransitionError,
      "No transition found with name 'publish'"
    );
  });
});

Deno.test("Resource Embedding", async (t) => {
  await t.step("should embed single resource", () => {
    const parent = new Resource({ type: "article", id: "1" });
    const child = new Resource({ type: "author", id: "123" });
    
    parent.embed("author", child);
    
    const embedded = parent.getEmbedded("author") as Resource[];
    assertExists(embedded);
    assertEquals(embedded.length, 1);
    assertEquals(embedded[0].getType(), "author");
    assertEquals(embedded[0].getId(), "123");
  });

  await t.step("should embed multiple resources", () => {
    const parent = new Resource({ type: "article", id: "1" });
    const comments = [
      new Resource({ type: "comment", id: "1" }),
      new Resource({ type: "comment", id: "2" })
    ];
    
    parent.embed("comments", comments);
    
    const embedded = parent.getEmbedded("comments") as Resource[];
    assertExists(embedded);
    assertEquals(embedded.length, 2);
    assertEquals(embedded[0].getType(), "comment");
    assertEquals(embedded[1].getType(), "comment");
  });

  await t.step("should handle nested embedding", () => {
    const article = new Resource({ type: "article", id: "1" });
    const author = new Resource({ type: "author", id: "123" });
    const company = new Resource({ type: "company", id: "456" });
    
    author.embed("company", company);
    article.embed("author", author);
    
    const embeddedAuthor = article.getEmbedded("author") as Resource[];
    assertExists(embeddedAuthor);
    assertEquals(embeddedAuthor[0].getType(), "author");
    
    const embeddedCompany = embeddedAuthor[0].getEmbedded("company") as Resource[];
    assertExists(embeddedCompany);
    assertEquals(embeddedCompany[0].getType(), "company");
  });

  await t.step("should check if resource has embedded resources", () => {
    const parent = new Resource({ type: "article", id: "1" });
    const child = new Resource({ type: "author", id: "123" });
    
    parent.embed("author", child);
    
    assertEquals(parent.hasEmbedded("author"), true);
    assertEquals(parent.hasEmbedded("comments"), false);
  });

  await t.step("should get all embedded resources", () => {
    const parent = new Resource({ type: "article", id: "1" });
    const author = new Resource({ type: "author", id: "123" });
    const comments = [
      new Resource({ type: "comment", id: "1" }),
      new Resource({ type: "comment", id: "2" })
    ];
    
    parent.embed("author", author);
    parent.embed("comments", comments);
    
    const allEmbedded = parent.getEmbedded() as Record<string, Resource[]>;
    assertExists(allEmbedded);
    assertEquals(Object.keys(allEmbedded).length, 2);
    assertEquals(allEmbedded.author.length, 1);
    assertEquals(allEmbedded.comments.length, 2);
  });

  await t.step("should handle empty embedded resources", () => {
    const parent = new Resource({ type: "article", id: "1" });
    parent.embed("comments", []);
    
    const embedded = parent.getEmbedded("comments") as Resource[];
    assertExists(embedded);
    assertEquals(embedded.length, 0);
  });

  await t.step("should handle updating embedded resources", () => {
    const parent = new Resource({ type: "article", id: "1" });
    const author = new Resource({ type: "author", id: "123" });
    
    parent.embed("author", author);
    
    // Update author properties
    const embeddedAuthor = parent.getEmbedded("author") as Resource[];
    assertExists(embeddedAuthor);
    embeddedAuthor[0].setProperty("name", "John Doe");
    
    // Verify the update
    const updatedAuthor = parent.getEmbedded("author") as Resource[];
    assertExists(updatedAuthor);
    assertEquals(updatedAuthor[0].getProperty("name"), "John Doe");
  });

  await t.step("should handle circular references", () => {
    const article = new Resource({ type: "article", id: "1" });
    const author = new Resource({ type: "author", id: "123" });
    
    article.embed("author", author);
    author.embed("articles", article);
    
    const embeddedAuthor = article.getEmbedded("author") as Resource[];
    assertExists(embeddedAuthor);
    assertEquals(embeddedAuthor[0].getType(), "author");
  });

  await t.step("should handle deep nested updates", () => {
    const article = new Resource({ type: "article", id: "1" });
    const author = new Resource({ type: "author", id: "123" });
    const company = new Resource({ type: "company", id: "456" });
    
    author.embed("company", company);
    article.embed("author", author);
    
    // Update deeply nested resource
    const embeddedAuthor = article.getEmbedded("author") as Resource[];
    assertExists(embeddedAuthor);
    const embeddedCompany = embeddedAuthor[0].getEmbedded("company") as Resource[];
    assertExists(embeddedCompany);
    embeddedCompany[0].setProperty("name", "Test Company");
    
    // Verify the update
    const updatedAuthor = article.getEmbedded("author") as Resource[];
    assertExists(updatedAuthor);
    const updatedCompany = updatedAuthor[0].getEmbedded("company") as Resource[];
    assertExists(updatedCompany);
    assertEquals(updatedCompany[0].getProperty("name"), "Test Company");
  });
}); 