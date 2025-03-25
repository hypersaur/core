import { assertEquals, assertExists, assertThrows } from "jsr:@std/assert";
import { Collection } from "../../hyperdeno/core/collection.ts";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { InvalidArgumentError } from "../../hyperdeno/core/errors.ts";
import type { Link } from "../../hyperdeno/core/link.ts";

Deno.test("Collection Creation and Initialization", async (t) => {
  await t.step("should create an empty collection", () => {
    const collection = new Collection();
    const json = collection.toJSON();
    assertEquals(json.type, "collection");
    assertEquals(collection.getCount(), 0);
  });

  await t.step("should create a collection with items", () => {
    const items = [
      new Resource({ type: "article", id: "1" }),
      new Resource({ type: "article", id: "2" })
    ];
    const collection = new Collection({ 
      type: "articles", 
      items
    });
    assertEquals(collection.getCount(), 2);
    assertEquals(collection.getItems(), items);
  });

  await t.step("should add single item", () => {
    const collection = new Collection({ type: "articles" });
    const item = new Resource({ type: "article", id: "1" });
    collection.addItem(item);
    assertEquals(collection.getCount(), 1);
    assertEquals(collection.getItems()[0], item);
  });

  await t.step("should add multiple items", () => {
    const collection = new Collection({ type: "articles" });
    const items = [
      new Resource({ type: "article", id: "1" }),
      new Resource({ type: "article", id: "2" })
    ];
    collection.addItems(items);
    assertEquals(collection.getCount(), 2);
    assertEquals(collection.getItems(), items);
  });

  await t.step("should handle large collections", () => {
    const collection = new Collection({ type: "articles" });
    const items = Array.from({ length: 1000 }, (_, i) => 
      new Resource({ type: "article", id: String(i + 1) })
    );
    collection.addItems(items);
    assertEquals(collection.getCount(), 1000);
    assertEquals(collection.getItems(), items);
  });

  await t.step("should throw error for invalid items", () => {
    const collection = new Collection({ type: "articles" });
    assertThrows(
      () => collection.addItems([null as unknown as Resource]),
      InvalidArgumentError
    );
  });

  await t.step("should sort items by property", () => {
    const collection = new Collection({ type: "articles" });
    const items = [
      new Resource({ 
        type: "article", 
        id: "1", 
        properties: { title: "C" } 
      }),
      new Resource({ 
        type: "article", 
        id: "2", 
        properties: { title: "A" } 
      }),
      new Resource({ 
        type: "article", 
        id: "3", 
        properties: { title: "B" } 
      })
    ];
    collection.addItems(items);
    collection.sort((a, b) => 
      (a.getProperty("title") as string).localeCompare(b.getProperty("title") as string)
    );
    assertEquals(collection.getItems()[0].getProperty("title"), "A");
    assertEquals(collection.getItems()[1].getProperty("title"), "B");
    assertEquals(collection.getItems()[2].getProperty("title"), "C");
  });

  await t.step("should filter items by property", () => {
    const collection = new Collection({ type: "articles" });
    const items = [
      new Resource({ 
        type: "article", 
        id: "1", 
        properties: { published: true } 
      }),
      new Resource({ 
        type: "article", 
        id: "2", 
        properties: { published: false } 
      }),
      new Resource({ 
        type: "article", 
        id: "3", 
        properties: { published: true } 
      })
    ];
    collection.addItems(items);
    const published = collection.filter(item => item.getProperty("published") === true);
    assertEquals(published.length, 2);
    assertEquals(published[0].getProperty("published"), true);
    assertEquals(published[1].getProperty("published"), true);
  });
});

Deno.test("Collection JSON Serialization", async (t) => {
  await t.step("should serialize empty collection", () => {
    const collection = new Collection({ type: "articles" });
    const json = collection.toJSON();
    assertEquals(json.type, "articles");
    assertExists(json.embedded);
    const embedded = json.embedded as Record<string, Array<unknown>>;
    assertEquals(embedded.items, []);
  });

  await t.step("should serialize collection with items", () => {
    const items = [
      new Resource({ type: "article", id: "1" }),
      new Resource({ type: "article", id: "2" })
    ];
    const collection = new Collection({ 
      type: "articles", 
      items
    });
    const json = collection.toJSON();
    assertEquals(json.type, "articles");
    assertExists(json.embedded);
    const embedded = json.embedded as Record<string, Array<{ id: string }>>;
    assertEquals(embedded.items.length, 2);
    assertEquals(embedded.items[0].id, "1");
    assertEquals(embedded.items[1].id, "2");
  });
}); 