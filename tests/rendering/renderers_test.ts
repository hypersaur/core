import { assertEquals, assertExists } from "jsr:@std/assert";
import { HalRenderer } from "../../hyperdeno/rendering/hal_renderer.ts";
import { HtmlRenderer } from "../../hyperdeno/rendering/html_renderer.ts";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { Collection } from "../../hyperdeno/core/collection.ts";

Deno.test("HAL Renderer Tests", async (t) => {
  await t.step("should render basic resource", async () => {
    const renderer = new HalRenderer();
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { title: "Test Resource" }
    });

    const response = renderer.render(resource);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "application/hal+json");

    const json = await response.json();
    assertEquals(json.type, "test");
    assertEquals(json.properties.title, "Test Resource");
  });

  await t.step("should render resource with links", async () => {
    const renderer = new HalRenderer();
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { title: "Test Resource" }
    });
    resource.addLink("self", "/test/1");
    resource.addLink("related", "/test/2");

    const response = renderer.render(resource);
    const json = await response.json();

    assertEquals(json.links.self.href, "/test/1");
    assertEquals(json.links.related.href, "/test/2");
  });

  await t.step("should render resource with embedded resources", async () => {
    const renderer = new HalRenderer();
    const embeddedResource = new Resource({
      type: "embedded",
      id: "2",
      properties: { title: "Embedded Resource" }
    });
    
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { title: "Test Resource" }
    });
    resource.embed("related", embeddedResource);

    const response = renderer.render(resource);
    const json = await response.json();

    assertEquals(json.embedded.related.type, "embedded");
    assertEquals(json.embedded.related.properties.title, "Embedded Resource");
  });

  await t.step("should render collection", async () => {
    const renderer = new HalRenderer();
    const items = [
      new Resource({ type: "test", id: "1", properties: { title: "Item 1" } }),
      new Resource({ type: "test", id: "2", properties: { title: "Item 2" } })
    ];
    const collection = new Collection({ type: "collection", items });

    const response = renderer.render(collection);
    const json = await response.json();

    assertEquals(json.type, "collection");
    assertEquals(json.embedded.items.length, 2);
    assertEquals(json.embedded.items[0].properties.title, "Item 1");
    assertEquals(json.embedded.items[1].properties.title, "Item 2");
  });
});

Deno.test("HTML Renderer Tests", async (t) => {
  await t.step("should render basic resource", async () => {
    const renderer = new HtmlRenderer();
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { title: "Test Resource" }
    });

    const response = renderer.render(resource);
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "text/html");

    const html = await response.text();
    assertExists(html);
    assertEquals(html.includes("Test Resource"), true);
  });

  await t.step("should render resource with links", async () => {
    const renderer = new HtmlRenderer();
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { title: "Test Resource" }
    });
    resource.addLink("self", "/test/1");
    resource.addLink("related", "/test/2");

    const response = renderer.render(resource);
    const html = await response.text();

    assertEquals(html.includes('href="/test/1"'), true);
    assertEquals(html.includes('href="/test/2"'), true);
    assertEquals(html.includes('rel="self"'), true);
    assertEquals(html.includes('rel="related"'), true);
  });

  await t.step("should render resource with embedded resources", async () => {
    const renderer = new HtmlRenderer();
    const embeddedResource = new Resource({
      type: "embedded",
      id: "2",
      properties: { title: "Embedded Resource" }
    });
    
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { title: "Test Resource" }
    });
    resource.embed("related", embeddedResource);

    const response = renderer.render(resource);
    const html = await response.text();

    assertEquals(html.includes("Embedded Resource"), true);
    assertEquals(html.includes("Embedded Resources"), true);
  });

  await t.step("should render collection", async () => {
    const renderer = new HtmlRenderer();
    const items = [
      new Resource({ type: "test", id: "1", properties: { title: "Item 1" } }),
      new Resource({ type: "test", id: "2", properties: { title: "Item 2" } })
    ];
    const collection = new Collection({ type: "collection", items });

    const response = renderer.render(collection);
    const html = await response.text();

    assertEquals(html.includes("Item 1"), true);
    assertEquals(html.includes("Item 2"), true);
  });

  await t.step("should escape HTML special characters", async () => {
    const renderer = new HtmlRenderer();
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { 
        title: "Test <script>alert('xss')</script> Resource",
        description: "Contains & special characters"
      }
    });

    const response = renderer.render(resource);
    const html = await response.text();

    assertEquals(html.includes("<script>"), false);
    assertEquals(html.includes("&lt;script&gt;"), true);
    assertEquals(html.includes("&amp;"), true);
    assertEquals(html.includes("&"), true);
  });
});

Deno.test("Complex Resource Rendering Tests", async (t) => {
  // Helper function to create a comment resource
  function createComment(id: string, author: string, content: string): Resource {
    const comment = new Resource({
      type: "comment",
      id,
      properties: {
        author,
        content,
        createdAt: "2024-03-20T10:00:00Z"
      }
    });
    comment.addLink("self", `/comments/${id}`);
    return comment;
  }

  // Helper function to create a post resource with comments
  function createPost(id: string, title: string, content: string, comments: Resource[]): Resource {
    const post = new Resource({
      type: "post",
      id,
      properties: {
        title,
        content,
        author: "John Doe",
        createdAt: "2024-03-20T09:00:00Z"
      }
    });
    post.addLink("self", `/posts/${id}`);
    post.addLink("author", "/users/john-doe");
    post.embed("comments", comments);
    return post;
  }

  await t.step("should render posts with comments in HAL format", async () => {
    const renderer = new HalRenderer();
    
    // Create test data
    const post1Comments = [
      createComment("1", "Alice", "Great post!"),
      createComment("2", "Bob", "Thanks for sharing")
    ];
    
    const post2Comments = [
      createComment("3", "Charlie", "Interesting perspective"),
      createComment("4", "Diana", "I disagree with point #2")
    ];

    const posts = [
      createPost("1", "First Post", "This is the content of the first post", post1Comments),
      createPost("2", "Second Post", "This is the content of the second post", post2Comments)
    ];

    const collection = new Collection({ type: "posts", items: posts });
    collection.addLink("self", "/posts");

    const response = renderer.render(collection);
    const json = await response.json();

    // Verify collection structure
    assertEquals(json.type, "posts");
    assertEquals(json.embedded.items.length, 2);

    // Verify first post
    const firstPost = json.embedded.items[0];
    assertEquals(firstPost.type, "post");
    assertEquals(firstPost.properties.title, "First Post");
    assertEquals(firstPost.links.self.href, "/posts/1");
    assertEquals(firstPost.embedded.comments.length, 2);
    assertEquals(firstPost.embedded.comments[0].properties.author, "Alice");
    assertEquals(firstPost.embedded.comments[1].properties.author, "Bob");

    // Verify second post
    const secondPost = json.embedded.items[1];
    assertEquals(secondPost.type, "post");
    assertEquals(secondPost.properties.title, "Second Post");
    assertEquals(secondPost.embedded.comments.length, 2);
    assertEquals(secondPost.embedded.comments[0].properties.author, "Charlie");
  });

  await t.step("should render posts with comments in HTML format", async () => {
    const renderer = new HtmlRenderer();
    
    // Create test data
    const post1Comments = [
      createComment("1", "Alice", "Great post!"),
      createComment("2", "Bob", "Thanks for sharing")
    ];
    
    const post2Comments = [
      createComment("3", "Charlie", "Interesting perspective"),
      createComment("4", "Diana", "I disagree with point #2")
    ];

    const posts = [
      createPost("1", "First Post", "This is the content of the first post", post1Comments),
      createPost("2", "Second Post", "This is the content of the second post", post2Comments)
    ];

    const collection = new Collection({ type: "posts", items: posts });
    collection.addLink("self", "/posts");

    const response = renderer.render(collection);
    const html = await response.text();

    // Verify basic structure
    assertEquals(html.includes("<title>Resource</title>"), true);
    assertEquals(html.includes("Collection Items"), true);

    // Verify posts content
    assertEquals(html.includes("First Post"), true);
    assertEquals(html.includes("Second Post"), true);
    assertEquals(html.includes("This is the content of the first post"), true);
    assertEquals(html.includes("This is the content of the second post"), true);

    // Verify comments
    assertEquals(html.includes("Great post!"), true);
    assertEquals(html.includes("Thanks for sharing"), true);
    assertEquals(html.includes("Interesting perspective"), true);
    assertEquals(html.includes("I disagree with point #2"), true);

    // Verify authors
    assertEquals(html.includes("Alice"), true);
    assertEquals(html.includes("Bob"), true);
    assertEquals(html.includes("Charlie"), true);
    assertEquals(html.includes("Diana"), true);

    // Verify links
    assertEquals(html.includes('href="/posts/1"'), true);
    assertEquals(html.includes('href="/posts/2"'), true);
    assertEquals(html.includes('href="/users/john-doe"'), true);
  });
}); 