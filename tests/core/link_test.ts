import { assertEquals, assertExists, assertThrows } from "jsr:@std/assert";
import { LinkManager, type Link, STANDARD_RELS } from "../../hyperdeno/core/link.ts";
import { InvalidArgumentError } from "../../hyperdeno/core/errors.ts";

Deno.test("LinkManager Creation and Management", async (t) => {
  await t.step("should create empty link manager", () => {
    const manager = new LinkManager();
    assertExists(manager);
    assertEquals(Object.keys(manager.getLinks()).length, 0);
  });

  await t.step("should create link manager with initial links", () => {
    const initialLinks = {
      self: { rel: "self", href: "/articles/1", method: "GET" },
      edit: { rel: "edit", href: "/articles/1", method: "PUT" }
    };
    const manager = new LinkManager(initialLinks);
    const links = manager.getLinks();
    
    assertEquals(Object.keys(links).length, 2);
    assertEquals((links.self as Link).href, "/articles/1");
    assertEquals((links.edit as Link).method, "PUT");
  });

  await t.step("should add single link", () => {
    const manager = new LinkManager();
    manager.addLink("self", "/articles/1");
    
    const links = manager.getLinks();
    assertEquals(Object.keys(links).length, 1);
    assertEquals((links.self as Link).href, "/articles/1");
    assertEquals((links.self as Link).method, "GET"); // Default method
  });

  await t.step("should add link with custom method and options", () => {
    const manager = new LinkManager();
    manager.addLink("edit", "/articles/1", "PUT", {
      title: "Edit Article",
      type: "application/json",
      templated: true
    });
    
    const link = manager.getLink("edit") as Link;
    assertEquals(link.href, "/articles/1");
    assertEquals(link.method, "PUT");
    assertEquals(link.title, "Edit Article");
    assertEquals(link.type, "application/json");
    assertEquals(link.templated, true);
  });

  await t.step("should handle multiple links for same relation", () => {
    const manager = new LinkManager();
    manager.addLink("alternate", "/articles/1.json", "GET", { type: "application/json" });
    manager.addLink("alternate", "/articles/1.xml", "GET", { type: "application/xml" });
    
    const links = manager.getLink("alternate") as Link[];
    assertEquals(links.length, 2);
    assertEquals(links[0].href, "/articles/1.json");
    assertEquals(links[0].type, "application/json");
    assertEquals(links[1].href, "/articles/1.xml");
    assertEquals(links[1].type, "application/xml");
  });

  await t.step("should remove link", () => {
    const manager = new LinkManager();
    manager.addLink("self", "/articles/1");
    manager.addLink("edit", "/articles/1", "PUT");
    
    manager.removeLink("edit");
    const links = manager.getLinks();
    
    assertEquals(Object.keys(links).length, 1);
    assertEquals((links.self as Link).href, "/articles/1");
  });

  await t.step("should check link existence", () => {
    const manager = new LinkManager();
    manager.addLink("self", "/articles/1");
    
    assertEquals(manager.hasLink("self"), true);
    assertEquals(manager.hasLink("edit"), false);
  });

  await t.step("should get link relations", () => {
    const manager = new LinkManager();
    manager.addLink("self", "/articles/1");
    manager.addLink("edit", "/articles/1", "PUT");
    manager.addLink("delete", "/articles/1", "DELETE");
    
    const relations = manager.getLinkRelations();
    assertEquals(relations.length, 3);
    assertEquals(relations.includes("self"), true);
    assertEquals(relations.includes("edit"), true);
    assertEquals(relations.includes("delete"), true);
  });

  await t.step("should set self link", () => {
    const manager = new LinkManager();
    manager.setSelfLink("/articles/1");
    
    const link = manager.getLink("self") as Link;
    assertEquals(link.href, "/articles/1");
    assertEquals(link.method, "GET");
  });

  await t.step("should create link builder", () => {
    const baseUrl = "https://api.example.com";
    const buildLink = LinkManager.createLinkBuilder(baseUrl);
    
    const link = buildLink("/articles/1", "self");
    assertEquals(link.href, "https://api.example.com/articles/1");
    assertEquals(link.rel, "self");
    assertEquals(link.method, "GET");
  });

  await t.step("should handle link builder with trailing slash", () => {
    const baseUrl = "https://api.example.com/";
    const buildLink = LinkManager.createLinkBuilder(baseUrl);
    
    const link = buildLink("/articles/1", "self");
    assertEquals(link.href, "https://api.example.com/articles/1");
  });

  await t.step("should handle link builder without leading slash", () => {
    const baseUrl = "https://api.example.com";
    const buildLink = LinkManager.createLinkBuilder(baseUrl);
    
    const link = buildLink("articles/1", "self");
    assertEquals(link.href, "https://api.example.com/articles/1");
  });

  await t.step("should clone link manager", () => {
    const manager = new LinkManager();
    manager.addLink("self", "/articles/1");
    manager.addLink("edit", "/articles/1", "PUT");
    
    const clone = manager.clone();
    const links = clone.getLinks();
    
    assertEquals(Object.keys(links).length, 2);
    assertEquals((links.self as Link).href, "/articles/1");
    assertEquals((links.edit as Link).method, "PUT");
  });

  await t.step("should validate link parameters", () => {
    const manager = new LinkManager();
    
    assertThrows(() => {
      manager.addLink("", "/articles/1");
    }, InvalidArgumentError, "Link relation must be a non-empty string");
    
    assertThrows(() => {
      manager.addLink("self", "");
    }, InvalidArgumentError, "Link href must be a non-empty string");
  });

  await t.step("should use standard link relations", () => {
    const manager = new LinkManager();
    manager.addLink(STANDARD_RELS.SELF, "/articles/1");
    manager.addLink(STANDARD_RELS.EDIT, "/articles/1");
    manager.addLink(STANDARD_RELS.DELETE, "/articles/1");
    
    assertEquals(manager.hasLink(STANDARD_RELS.SELF), true);
    assertEquals(manager.hasLink(STANDARD_RELS.EDIT), true);
    assertEquals(manager.hasLink(STANDARD_RELS.DELETE), true);
  });
}); 