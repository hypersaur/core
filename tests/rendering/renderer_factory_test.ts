import { assertEquals, assertExists, assertThrows } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { RendererFactory } from "../../hyperdeno/rendering/renderer_factory.ts";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { Collection } from "../../hyperdeno/core/collection.ts";
import { Renderer } from "../../hyperdeno/rendering/renderer.ts";
import { HalRenderer } from "../../hyperdeno/rendering/hal_renderer.ts";
import { HtmlRenderer } from "../../hyperdeno/rendering/html_renderer.ts";

class TestRenderer extends Renderer {
  override getMediaType(): string {
    return "application/test+json";
  }

  override render(resource: Resource | Collection): Response {
    const data = {
      type: resource instanceof Resource ? resource.getType() : "collection",
      id: resource instanceof Resource ? resource.getId() : undefined,
      properties: resource instanceof Resource ? 
        resource.getProperties() : 
        (resource as Collection).getItems().map(item => ({
          type: item.getType(),
          id: item.getId(),
          properties: item.getProperties()
        }))
    };
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": this.getMediaType() }
    });
  }

  override getOptions() {
    return {};
  }
}

Deno.test("RendererFactory Creation and Initialization", async (t) => {
  await t.step("should create an empty factory", () => {
    const factory = new RendererFactory();
    const renderers = factory.getRenderer("application/hal+json");
    assertThrows(() => factory.getRenderer("application/unknown"));
  });

  await t.step("should add renderer", () => {
    const factory = new RendererFactory();
    factory.registerRenderer(new TestRenderer());
    const renderer = factory.getRenderer("application/test+json");
    assertEquals(renderer instanceof TestRenderer, true);
  });

  await t.step("should get renderer by media type", () => {
    const factory = new RendererFactory();
    const renderer = new TestRenderer();
    factory.registerRenderer(renderer);
    
    const found = factory.getRenderer("application/test+json");
    assertEquals(found, renderer);
  });

  await t.step("should handle unknown media type", () => {
    const factory = new RendererFactory();
    const result = factory.getRenderer("unknown/type");
    assertEquals(result?.constructor.name, "HalRenderer"); // Falls back to HAL renderer
  });

  await t.step("should render resource", async () => {
    const factory = new RendererFactory();
    factory.registerRenderer(new TestRenderer());
    
    const resource = new Resource(undefined, undefined, {
      type: "test",
      id: "123",
      properties: { name: "Test Resource" }
    });
    
    const response = factory.render(resource, "application/test+json");
    const text = await response.text();
    const data = JSON.parse(text);
    assertEquals(data.type, "test");
    assertEquals(data.id, "123");
    assertEquals(data.properties.name, "Test Resource");
  });

  await t.step("should render collection", async () => {
    const factory = new RendererFactory();
    factory.registerRenderer(new TestRenderer());
    
    const collection = new Collection({
      type: "test",
      items: [
        new Resource(undefined, undefined, { type: "test", id: "1" }),
        new Resource(undefined, undefined, { type: "test", id: "2" })
      ]
    });
    
    const response = factory.render(collection, "application/test+json");
    const text = await response.text();
    const data = JSON.parse(text);
    assertEquals(data.type, "collection");
    assertEquals(data.properties.length, 2);
    assertEquals(data.properties[0].type, "test");
    assertEquals(data.properties[0].id, "1");
    assertEquals(data.properties[1].type, "test");
    assertEquals(data.properties[1].id, "2");
  });

  await t.step("should render resource with links", async () => {
    const factory = new RendererFactory();
    factory.registerRenderer(new TestRenderer());
    
    const resource = new Resource(undefined, undefined, {
      type: "test",
      id: "1"
    });
    resource.addLink("self", "/test/1");
    resource.addLink("edit", "/test/1/edit", "PUT");
    
    const response = factory.render(resource, "application/test+json");
    const text = await response.text();
    const data = JSON.parse(text);
    assertEquals(data.type, "test");
    assertEquals(data.id, "1");
  });
});

Deno.test("RendererFactory Creation and Management", async (t) => {
  await t.step("should create renderer factory with default renderers", () => {
    const factory = new RendererFactory();
    assertExists(factory);
    
    const halRenderer = factory.getRenderer("application/hal+json");
    const htmlRenderer = factory.getRenderer("text/html");
    
    assertExists(halRenderer);
    assertExists(htmlRenderer);
    assertEquals(halRenderer instanceof HalRenderer, true);
    assertEquals(htmlRenderer instanceof HtmlRenderer, true);
  });

  await t.step("should register custom renderer", () => {
    const factory = new RendererFactory();
    const testRenderer = new TestRenderer();
    factory.registerRenderer(testRenderer);

    const renderer = factory.getRenderer("application/test+json");
    assertExists(renderer);
    assertEquals(renderer instanceof TestRenderer, true);
  });

  await t.step("should handle Accept header parsing", () => {
    const factory = new RendererFactory();
    const testRenderer = new TestRenderer();
    factory.registerRenderer(testRenderer);

    // Test single media type
    let renderer = factory.getRenderer("application/test+json");
    assertEquals(renderer instanceof TestRenderer, true);

    // Test multiple media types
    renderer = factory.getRenderer("application/json, application/test+json");
    assertEquals(renderer instanceof TestRenderer, true);

    // Test media type with quality factor
    renderer = factory.getRenderer("application/json;q=0.8, application/test+json;q=0.9");
    assertEquals(renderer instanceof TestRenderer, true);

    // Test wildcard
    renderer = factory.getRenderer("*/*");
    assertEquals(renderer instanceof HalRenderer, true);
  });

  await t.step("should default to HAL renderer", () => {
    const factory = new RendererFactory();
    const renderer = factory.getRenderer("application/json");
    assertEquals(renderer instanceof HalRenderer, true);
  });

  await t.step("should render resource with appropriate renderer", () => {
    const factory = new RendererFactory();
    const resource = new Resource({
      type: "test",
      id: "1",
      properties: { name: "Test Resource" }
    });

    // Test HAL rendering
    let response = factory.render(resource, "application/hal+json");
    assertEquals(response.headers.get("Content-Type"), "application/hal+json");
    
    // Test HTML rendering
    response = factory.render(resource, "text/html");
    assertEquals(response.headers.get("Content-Type"), "text/html");
  });

  await t.step("should render collection with appropriate renderer", () => {
    const factory = new RendererFactory();
    const collection = new Collection({
      type: "tests",
      items: [
        new Resource({ type: "test", id: "1" }),
        new Resource({ type: "test", id: "2" })
      ]
    });

    // Test HAL rendering
    let response = factory.render(collection, "application/hal+json");
    assertEquals(response.headers.get("Content-Type"), "application/hal+json");
    
    // Test HTML rendering
    response = factory.render(collection, "text/html");
    assertEquals(response.headers.get("Content-Type"), "text/html");
  });

  await t.step("should handle custom renderer rendering", () => {
    const factory = new RendererFactory();
    const testRenderer = new TestRenderer();
    factory.registerRenderer(testRenderer);

    const resource = new Resource({ type: "test", id: "1" });
    const response = factory.render(resource, "application/test+json");
    
    assertEquals(response.headers.get("Content-Type"), "application/test+json");
  });

  await t.step("should handle empty Accept header", () => {
    const factory = new RendererFactory();
    const renderer = factory.getRenderer("");
    assertEquals(renderer instanceof HalRenderer, true);
  });

  await t.step("should handle invalid Accept header", () => {
    const factory = new RendererFactory();
    const renderer = factory.getRenderer("invalid/type");
    assertEquals(renderer instanceof HalRenderer, true);
  });

  await t.step("should handle multiple renderers for same media type", () => {
    const factory = new RendererFactory();
    const testRenderer1 = new TestRenderer();
    const testRenderer2 = new TestRenderer();
    
    factory.registerRenderer(testRenderer1);
    factory.registerRenderer(testRenderer2);

    const renderer = factory.getRenderer("application/test+json");
    assertExists(renderer);
    // Should return the first registered renderer
    assertEquals(renderer === testRenderer1, true);
  });

  await t.step("should handle quality values in Accept header", () => {
    const factory = new RendererFactory();
    const testRenderer = new TestRenderer();
    factory.registerRenderer(testRenderer);

    const acceptHeader = "application/json;q=0.8, application/test+json;q=0.9, text/html;q=0.7";
    const renderer = factory.getRenderer(acceptHeader);
    assertEquals(renderer instanceof TestRenderer, true);
  });
}); 