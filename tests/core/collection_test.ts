import { assertEquals, assertExists, assertThrows } from "jsr:@std/assert";
import { Collection } from "../../hyperdeno/core/collection.ts";
import { Resource } from "../../hyperdeno/core/resource.ts";
import { InvalidArgumentError } from "../../hyperdeno/core/errors.ts";
import type { Link } from "../../hyperdeno/core/link.ts";

Deno.test("Collection Creation and Initialization", async (t) => {
  await t.step("should create an empty collection", () => {
    const collection = new Collection();
    assertEquals(collection.getType(), "collection");
    assertEquals(collection.getCount(), 0);
  });

  await t.step("should create a collection with items", () => {
    const items = [
      new Resource({ type: "article", id: "1" }),
      new Resource({ type: "article", id: "2" })
    ];
    const collection = new Collection({ type: "articles", items });
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
      new Resource({ type: "article", id: "1", properties: { title: "C" } }),
      new Resource({ type: "article", id: "2", properties: { title: "A" } }),
      new Resource({ type: "article", id: "3", properties: { title: "B" } })
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
      new Resource({ type: "article", id: "1", properties: { published: true } }),
      new Resource({ type: "article", id: "2", properties: { published: false } }),
      new Resource({ type: "article", id: "3", properties: { published: true } })
    ];
    collection.addItems(items);
    const published = collection.filter(item => item.getProperty("published") === true);
    assertEquals(published.length, 2);
    assertEquals(published[0].getProperty("published"), true);
    assertEquals(published[1].getProperty("published"), true);
  });

  await t.step("should handle pagination", () => {
    const collection = new Collection({ type: "articles" });
    const items = Array.from({ length: 100 }, (_, i) => 
      new Resource({ type: "article", id: String(i + 1) })
    );
    collection.addItems(items);
    collection.setPagination({ page: 1, pageSize: 10, total: 100 });
    assertEquals(collection.getPagination()?.page, 1);
    assertEquals(collection.getPagination()?.pageSize, 10);
    assertEquals(collection.getPagination()?.total, 100);
  });
});

Deno.test("Collection Creation and Management", async (t) => {
  await t.step("should create an empty collection", () => {
    const collection = new Collection();
    assertEquals(collection.getType(), "collection");
    assertEquals(collection.getCount(), 0);
  });

  await t.step("should create a collection with items", () => {
    const items = [
      new Resource({ type: "article", id: "1" }),
      new Resource({ type: "article", id: "2" })
    ];
    const collection = new Collection({ type: "articles", items });
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
      new Resource({ type: "article", id: "1", properties: { title: "C" } }),
      new Resource({ type: "article", id: "2", properties: { title: "A" } }),
      new Resource({ type: "article", id: "3", properties: { title: "B" } })
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
      new Resource({ type: "article", id: "1", properties: { published: true } }),
      new Resource({ type: "article", id: "2", properties: { published: false } }),
      new Resource({ type: "article", id: "3", properties: { published: true } })
    ];
    collection.addItems(items);
    const published = collection.filter(item => item.getProperty("published") === true);
    assertEquals(published.length, 2);
    assertEquals(published[0].getProperty("published"), true);
    assertEquals(published[1].getProperty("published"), true);
  });

  await t.step("should handle pagination", () => {
    const collection = new Collection({ type: "articles" });
    const items = Array.from({ length: 100 }, (_, i) => 
      new Resource({ type: "article", id: String(i + 1) })
    );
    collection.addItems(items);
    collection.setPagination({ page: 1, pageSize: 10, total: 100 });
    assertEquals(collection.getPagination()?.page, 1);
    assertEquals(collection.getPagination()?.pageSize, 10);
    assertEquals(collection.getPagination()?.total, 100);
  });

  await t.step("should handle collection pagination", () => {
    const items = Array.from({ length: 15 }, (_, i) => 
      new Resource({ type: "article", id: String(i + 1) })
    );
    const collection = new Collection({ items });
    
    collection.setPagination({
      page: 1,
      pageSize: 5,
      total: 15
    });
    
    const pagination = collection.getPagination();
    assertExists(pagination);
    assertEquals(pagination.page, 1);
    assertEquals(pagination.pageSize, 5);
    assertEquals(pagination.total, 15);
    
    // Test pagination links
    collection.addPaginationLinks("/api/articles");
    const links = collection.getLinks();
    const selfLink = links.self as Link;
    const nextLink = links.next as Link;
    
    assertExists(selfLink);
    assertExists(nextLink);
    assertEquals(selfLink.href, "/api/articles?page=1&pageSize=5");
    assertEquals(nextLink.href, "/api/articles?page=2&pageSize=5");
  });

  await t.step("should handle collection sorting", () => {
    const items = [
      new Resource({ type: "article", id: "1", properties: { title: "C" } }),
      new Resource({ type: "article", id: "2", properties: { title: "A" } }),
      new Resource({ type: "article", id: "3", properties: { title: "B" } })
    ];
    const collection = new Collection({ items });
    
    const sorted = collection.getItems().sort((a, b) => 
      (a.getProperty("title") as string).localeCompare(b.getProperty("title") as string)
    );
    
    assertEquals(sorted[0].getProperty("title"), "A");
    assertEquals(sorted[1].getProperty("title"), "B");
    assertEquals(sorted[2].getProperty("title"), "C");
  });

  await t.step("should handle collection filtering", () => {
    const items = [
      new Resource({ type: "article", id: "1", properties: { published: true } }),
      new Resource({ type: "article", id: "2", properties: { published: false } }),
      new Resource({ type: "article", id: "3", properties: { published: true } })
    ];
    const collection = new Collection({ items });
    
    const published = collection.getItems().filter(item => 
      item.getProperty("published") === true
    );
    
    assertEquals(published.length, 2);
    assertEquals(published[0].getId(), "1");
    assertEquals(published[1].getId(), "3");
  });

  await t.step("should handle collection links", () => {
    const collection = new Collection();
    collection.addLink("self", "/articles");
    collection.addLink("next", "/articles?page=2");
    
    const links = collection.getLinks();
    const selfLink = links.self as Link;
    const nextLink = links.next as Link;
    
    assertExists(selfLink);
    assertExists(nextLink);
    assertEquals(selfLink.href, "/articles");
    assertEquals(nextLink.href, "/articles?page=2");
  });

  await t.step("should handle collection metadata", () => {
    const items = Array.from({ length: 25 }, (_, i) => 
      new Resource({ type: "article", id: String(i + 1) })
    );
    const collection = new Collection({ items });
    
    collection.setProperty("total", 25);
    collection.setProperty("page", 1);
    collection.setProperty("pageSize", 10);
    
    assertEquals(collection.getProperty("total"), 25);
    assertEquals(collection.getProperty("page"), 1);
    assertEquals(collection.getProperty("pageSize"), 10);
  });

  await t.step("should handle collection name", () => {
    const collection = new Collection();
    collection.setCollectionName("articles");
    assertEquals(collection.getCollectionName(), "articles");
    
    assertThrows(() => {
      collection.setCollectionName("");
    }, InvalidArgumentError);
  });

  await t.step("should handle pagination methods", () => {
    const collection = new Collection();
    
    collection.setPage(2);
    collection.setPageSize(20);
    collection.setTotal(100);
    
    const pagination = collection.getPagination();
    assertExists(pagination);
    assertEquals(pagination.page, 2);
    assertEquals(pagination.pageSize, 20);
    assertEquals(pagination.total, 100);
  });
}); 