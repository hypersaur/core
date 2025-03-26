/**
 * HyperDeno Comprehensive Test Suite
 * 
 * This file contains all tests for the HyperDeno framework.
 * 
 * Test Coverage Table:
 * 
 * | Component         | Aspect                | Test Cases                                          | Test Method                                | Status |
 * |-------------------|----------------------|-----------------------------------------------------|-------------------------------------------|--------|
 * | **Error Handling**| Error Types          | Basic error creation, properties, inheritance        | `testErrorTypes`                           | [x]    |
 * |                   | Error Responses      | JSON serialization, response creation                | `testErrorResponses`                       | [x]    |
 * |                   | Standard Errors      | Error helpers (notFound, badRequest, etc.)           | `testStandardErrors`                       | [x]    |
 * | **Resource**      | Creation             | Empty resource, with props, with type/id             | `testResourceCreation`                     | [x]    |
 * |                   | Properties           | Get/set, nested properties, validation               | `testResourceProperties`                   | [x]    |
 * |                   | Links                | Add/get links, templated links, self links           | `testResourceLinks`                        | [x]    |
 * |                   | Embedded Resources   | Single/multiple, access, serialization               | `testResourceEmbedding`                    | [x]    |
 * |                   | State Transitions    | Add/apply transitions, conditions, validation        | `testResourceStateTransitions`             | [x]    |
 * |                   | Serialization        | Complete JSON serialization                          | `testResourceSerialization`                | [x]    |
 * | **Collection**    | Creation             | Empty, with items, with pagination                   | `testCollectionCreation`                   | [x]    |
 * |                   | Item Management      | Add/get items, sort, filter                          | `testCollectionItemManagement`             | [x]    |
 * |                   | Pagination           | Set/get, navigation links                            | `testCollectionPagination`                 | [x]    |
 * |                   | Serialization        | Complete JSON serialization with items               | `testCollectionSerialization`              | [x]    |
 * | **Link Management**| Creation            | Link creation, retrieval, standard relations         | `testLinkCreation`                         | [x]    |
 * |                   | Options              | HTTP methods, attributes, templated links            | `testLinkOptions`                          | [x]    |
 * |                   | Manager              | Multiple links, cloning, validation                  | `testLinkManager`                          | [x]    |
 * | **State Machine** | Transitions          | Add/get/apply transitions, validation                | `testStateTransitions`                     | [x]    |
 * |                   | Complex Flows        | Multi-state flows, conditional transitions           | `testComplexStateFlows`                    | [x]    |
 * | **Middleware**    | Chain               | Creation, execution, order                           | `testMiddlewareChain`                      | [x]    |
 * |                   | Context State        | Access, data sharing                                 | `testMiddlewareContext`                    | [x]    |
 * |                   | Error Handling       | Propagation, recovery                                | `testMiddlewareErrorHandling`              | [x]    |
 * | **Plugin System** | Registration         | Plugin registration, initialization                  | `testPluginRegistration`                   | [x]    |
 * |                   | Hooks                | Hook execution, priorities                           | `testPluginHooks`                          | [x]    |
 * |                   | Plugin Middleware    | Integration with middleware system                   | `testPluginMiddleware`                     | [x]    |
 * | **HAL-Forms**     | Templates            | Creation, properties, validation                     | `testHalFormTemplates`                     | [x]    |
 * |                   | Actions              | Add to resources, serialization                      | `testHalFormActions`                       | [x]    |
 * | **Router**        | Registration         | Basic routes, parameters, methods                    | `testRouterRegistration`                   | [x]    |
 * |                   | Handling             | Parameter extraction, matching, processing           | `testRouterHandling`                       | [x]    |
 * |                   | Resource Routes      | RESTful endpoints                                    | `testResourceRoutes`                       | [x]    |
 * |                   | Error Handling       | Not found, errors, custom handlers                   | `testRouterErrorHandling`                  | [x]    |
 * | **Content Negotiation** | Parsing        | Accept header, quality factors                       | `testContentNegotiationParsing`            | [x]    |
 * |                   | Selection            | Media type selection, format mapping                 | `testContentTypeSelection`                 | [x]    |
 * | **Renderer**      | Built-in Renderers   | JSON, HAL, Text renderers                           | `testBuiltInRenderers`                     | [x]    |
 * |                   | Custom Renderers     | Creation, registration, selection                    | `testCustomRenderers`                      | [x]    |
 * | **Event System**  | Event Emitter        | Registration, emission, removal                      | `testEventEmitter`                         | [x]    |
 * |                   | Framework Events     | Standard events, data structure                      | `testFrameworkEvents`                      | [x]    |
 * | **Configuration** | Management           | Get/set, overrides                                   | `testConfigurationManagement`              | [x]    |
 * |                   | Application          | Apply to server                                      | `testConfigurationApplication`             | [x]    |
 * | **Server**        | Creation             | Setup, registration, integration                     | `testServerCreation`                       | [x]    |
 * |                   | Request Flow         | End-to-end processing                                | `testServerRequestFlow`                    | [x]    |
 * | **Factory Functions** | Convenience      | createResource, createCollection, etc.              | `testFactoryFunctions`                     | [x]    |
 * 
 */

import {
    assertEquals,
    assertNotEquals,
    assertExists,
    assertThrows,
    assertArrayIncludes,
    assertStrictEquals,
    assertObjectMatch,
    assertStringIncludes
  } from "jsr:@std/assert";
  
  // Import the full framework from a single file
  import HyperDeno, {
    // Error classes
    ApiError,
    NotFoundError,
    ValidationError,
    AuthError,
    ServerError,
    StateTransitionError,
    InvalidArgumentError,
    ContentNegotiationError,
    createErrorResponse,
    Errors,
  
    // Core classes
    Resource,
    Collection,
    LinkManager,
    STANDARD_RELS,
    ResourceState,
    MiddlewareChain,
    PluginManager,
    HookType,
    
    // HTTP classes
    Router,
    HTTP_METHODS,
    createResponse,
    createJsonResponse,
    
    // Content negotiation
    MEDIA_TYPES,
    FORMAT_MAP,
    negotiateContentType,
    
    // Event system
    EventEmitter,
    FrameworkEvent,
    
    // Factory functions
    createResource,
    createCollection,
    createApp
  } from "./hyperdeno.ts";
  
  /**
   * Test Error Handling
   */
  Deno.test("Error Handling", async (t) => {
    await t.step("testErrorTypes - Test error types creation and properties", () => {
      // Base ApiError
      const apiError = new ApiError("Test error", 400, "TEST_ERROR", { field: "value" });
      assertEquals(apiError.message, "Test error");
      assertEquals(apiError.status, 400);
      assertEquals(apiError.code, "TEST_ERROR");
      assertEquals(apiError.details?.field, "value");
      
      // NotFoundError
      const notFoundError = new NotFoundError("Resource not found", "RESOURCE_NOT_FOUND", { id: "123" });
      assertEquals(notFoundError.message, "Resource not found");
      assertEquals(notFoundError.status, 404);
      assertEquals(notFoundError.code, "RESOURCE_NOT_FOUND");
      assertEquals(notFoundError.details?.id, "123");
      
      // ValidationError
      const validationError = new ValidationError("Invalid data", "VALIDATION_ERROR", { 
        fields: { name: "Required" } 
      });
      assertEquals(validationError.message, "Invalid data");
      assertEquals(validationError.status, 400);
      assertEquals(validationError.code, "VALIDATION_ERROR");
      assertEquals(validationError.details?.fields.name, "Required");
      
      // AuthError
      const authError = new AuthError("Not authorized", "UNAUTHORIZED", { 
        required: "admin" 
      });
      assertEquals(authError.message, "Not authorized");
      assertEquals(authError.status, 401);
      assertEquals(authError.code, "UNAUTHORIZED");
      assertEquals(authError.details?.required, "admin");
      
      // ServerError
      const serverError = new ServerError("Internal error", "SERVER_ERROR", { 
        component: "database" 
      });
      assertEquals(serverError.message, "Internal error");
      assertEquals(serverError.status, 500);
      assertEquals(serverError.code, "SERVER_ERROR");
      assertEquals(serverError.details?.component, "database");
      
      // StateTransitionError
      const stateError = new StateTransitionError("Invalid transition", { 
        from: "draft",
        to: "published",
        available: ["review"]
      });
      assertEquals(stateError.message, "Invalid transition");
      assertEquals(stateError.status, 400);
      assertEquals(stateError.code, "STATE_TRANSITION_ERROR");
      assertEquals(stateError.details?.from, "draft");
      
      // InvalidArgumentError
      const argError = new InvalidArgumentError("Invalid argument", { 
        param: "id",
        value: -1,
        expected: "positive integer"
      });
      assertEquals(argError.message, "Invalid argument");
      assertEquals(argError.status, 400);
      assertEquals(argError.code, "INVALID_ARGUMENT");
      assertEquals(argError.details?.param, "id");
      
      // ContentNegotiationError
      const contentError = new ContentNegotiationError("Unsupported format", "UNSUPPORTED_FORMAT", { 
        requested: "text/csv",
        supported: ["application/json", "text/plain"]
      });
      assertEquals(contentError.message, "Unsupported format");
      assertEquals(contentError.status, 406);
      assertEquals(contentError.code, "UNSUPPORTED_FORMAT");
      assertArrayIncludes(contentError.details?.supported, ["application/json", "text/plain"]);
    });
    
    await t.step("testErrorResponses - Test error response creation", async () => {
      // Create error response from ApiError
      const error = new ValidationError("Invalid data", "VALIDATION_ERROR", { 
        fields: { name: "Required" } 
      });
      const response = createErrorResponse(error);
      
      // Verify response status
      assertEquals(response.status, 400);
      
      // Verify content type
      assertEquals(response.headers.get("Content-Type"), "application/json");
      
      // Parse response body and verify content
      const body = await response.json();
      assertEquals(body.error.message, "Invalid data");
      assertEquals(body.error.status, 400);
      assertEquals(body.error.code, "VALIDATION_ERROR");
      assertEquals(body.error.details.fields.name, "Required");
      
      // Test with generic Error
      const genericError = new Error("Generic error");
      const genericResponse = createErrorResponse(genericError);
      
      // Verify generic response has 500 status
      assertEquals(genericResponse.status, 500);
      
      // Parse generic response body and verify content
      const genericBody = await genericResponse.json();
      assertEquals(genericBody.error.message, "Generic error");
      assertEquals(genericBody.error.status, 500);
      assertEquals(genericBody.error.code, "INTERNAL_ERROR");
    });
    
    await t.step("testStandardErrors - Test standard error helpers", () => {
      // Not found error
      const notFoundResponse = Errors.notFound("Resource not found", { id: "123" });
      assertEquals(notFoundResponse.error.message, "Resource not found");
      assertEquals(notFoundResponse.error.status, 404);
      assertEquals(notFoundResponse.error.code, "RESOURCE_NOT_FOUND");
      assertEquals(notFoundResponse.error.details.id, "123");
      
      // Bad request error
      const badRequestResponse = Errors.badRequest("Invalid input", { fields: ["name"] });
      assertEquals(badRequestResponse.error.message, "Invalid input");
      assertEquals(badRequestResponse.error.status, 400);
      assertEquals(badRequestResponse.error.code, "BAD_REQUEST");
      assertArrayIncludes(badRequestResponse.error.details.fields, ["name"]);
      
      // Unauthorized error
      const unauthorizedResponse = Errors.unauthorized("Login required");
      assertEquals(unauthorizedResponse.error.message, "Login required");
      assertEquals(unauthorizedResponse.error.status, 401);
      assertEquals(unauthorizedResponse.error.code, "UNAUTHORIZED");
      
      // Forbidden error
      const forbiddenResponse = Errors.forbidden("Access denied");
      assertEquals(forbiddenResponse.error.message, "Access denied");
      assertEquals(forbiddenResponse.error.status, 403);
      assertEquals(forbiddenResponse.error.code, "FORBIDDEN");
      
      // Conflict error
      const conflictResponse = Errors.conflict("Resource exists", { id: "123" });
      assertEquals(conflictResponse.error.message, "Resource exists");
      assertEquals(conflictResponse.error.status, 409);
      assertEquals(conflictResponse.error.code, "CONFLICT");
      assertEquals(conflictResponse.error.details.id, "123");
      
      // Internal server error
      const serverErrorResponse = Errors.internalServerError("Database error");
      assertEquals(serverErrorResponse.error.message, "Database error");
      assertEquals(serverErrorResponse.error.status, 500);
      assertEquals(serverErrorResponse.error.code, "INTERNAL_SERVER_ERROR");
    });
  });
  
  /**
   * Test Resource System
   */
  Deno.test("Resource System", async (t) => {
    await t.step("testResourceCreation - Test resource creation and initialization", () => {
      // Create empty resource
      const emptyResource = new Resource();
      assertEquals(emptyResource.getType(), "");
      assertEquals(emptyResource.getId(), "");
      assertEquals(Object.keys(emptyResource.getProperties()).length, 0);
      
      // Create resource with type and ID
      const typedResource = new Resource({ type: "article", id: "123" });
      assertEquals(typedResource.getType(), "article");
      assertEquals(typedResource.getId(), "123");
      
      // Create resource with properties
      const propsResource = new Resource({
        type: "article",
        id: "123",
        properties: {
          title: "Test Article",
          published: true,
          tags: ["test", "example"]
        }
      });
      assertEquals(propsResource.getType(), "article");
      assertEquals(propsResource.getId(), "123");
      assertEquals(propsResource.getProperty("title"), "Test Article");
      assertEquals(propsResource.getProperty("published"), true);
      assertArrayIncludes(propsResource.getProperty("tags") as string[], ["test", "example"]);
      
      // Create resource with initial state
      const stateResource = new Resource({
        type: "article",
        id: "123",
        initialState: "draft"
      });
      assertEquals(stateResource.getState(), "draft");
      
      // Test setters
      const resource = new Resource();
      resource.setType("product");
      resource.setId("456");
      resource.setProperty("name", "Test Product");
      resource.setState("active");
      
      assertEquals(resource.getType(), "product");
      assertEquals(resource.getId(), "456");
      assertEquals(resource.getProperty("name"), "Test Product");
      assertEquals(resource.getState(), "active");
    });
    
    await t.step("testResourceProperties - Test resource property management", () => {
      const resource = new Resource();
      
      // Set and get simple properties
      resource.setProperty("string", "value");
      resource.setProperty("number", 42);
      resource.setProperty("boolean", true);
      resource.setProperty("null", null);
      resource.setProperty("array", [1, 2, 3]);
      resource.setProperty("object", { key: "value" });
      
      assertEquals(resource.getProperty("string"), "value");
      assertEquals(resource.getProperty("number"), 42);
      assertEquals(resource.getProperty("boolean"), true);
      assertEquals(resource.getProperty("null"), null);
      assertArrayIncludes(resource.getProperty("array") as number[], [1, 2, 3]);
      assertEquals((resource.getProperty("object") as Record<string, string>).key, "value");
      
      // Test undefined property
      assertEquals(resource.getProperty("nonexistent"), undefined);
      
      // Test nested properties
      resource.setProperty("user.name", "John");
      resource.setProperty("user.contact.email", "john@example.com");
      
      const user = resource.getProperty("user") as Record<string, unknown>;
      assertEquals(user.name, "John");
      assertEquals((user.contact as Record<string, string>).email, "john@example.com");
      
      // Test property update
      resource.setProperty("string", "updated");
      assertEquals(resource.getProperty("string"), "updated");
      
      // Test nested property update
      resource.setProperty("user.name", "Jane");
      assertEquals((resource.getProperty("user") as Record<string, string>).name, "Jane");
      
      // Test invalid property key
      assertThrows(
        () => resource.setProperty("", "value"),
        InvalidArgumentError,
        "Property key must be a non-empty string"
      );
    });
    
    await t.step("testResourceLinks - Test resource link management", () => {
      const resource = new Resource({ type: "article", id: "123" });
      
      // Add basic link
      resource.addLink("self", "/articles/123");
      let link = resource.getLink("self");
      assertExists(link);
      if (!Array.isArray(link)) {
        assertEquals(link.href, "/articles/123");
        assertEquals(link.method, "GET"); // Default method
      }
      
      // Add link with custom method
      resource.addLink("edit", "/articles/123/edit", "PUT");
      link = resource.getLink("edit");
      assertExists(link);
      if (!Array.isArray(link)) {
        assertEquals(link.href, "/articles/123/edit");
        assertEquals(link.method, "PUT");
      }
      
      // Add link with options
      resource.addLink("delete", "/articles/123", "DELETE", {
        title: "Delete Article",
        type: "application/json"
      });
      link = resource.getLink("delete");
      assertExists(link);
      if (!Array.isArray(link)) {
        assertEquals(link.href, "/articles/123");
        assertEquals(link.method, "DELETE");
        assertEquals(link.title, "Delete Article");
        assertEquals(link.type, "application/json");
      }
      
      // Add templated link
      resource.addTemplatedLink("search", "/articles{?query,category}");
      link = resource.getLink("search");
      assertExists(link);
      if (!Array.isArray(link)) {
        assertEquals(link.href, "/articles{?query,category}");
        assertEquals(link.templated, true);
      }
      
      // Test multiple links for same relation
      resource.addLink("alternate", "/articles/123.json", "GET", { type: "application/json" });
      resource.addLink("alternate", "/articles/123.xml", "GET", { type: "application/xml" });
      
      const alternateLinks = resource.getLink("alternate");
      assertExists(alternateLinks);
      if (Array.isArray(alternateLinks)) {
        assertEquals(alternateLinks.length, 2);
        assertEquals(alternateLinks[0].href, "/articles/123.json");
        assertEquals(alternateLinks[0].type, "application/json");
        assertEquals(alternateLinks[1].href, "/articles/123.xml");
        assertEquals(alternateLinks[1].type, "application/xml");
      }
      
      // Test get self link
      assertEquals(resource.getSelfLink(), "/articles/123");
      
      // Test remove link
      resource.removeLink("edit");
      assertEquals(resource.getLink("edit"), undefined);
      
      // Test has link
      assertEquals(resource.hasLink("self"), true);
      assertEquals(resource.hasLink("edit"), false);
      
      // Test get all links
      const links = resource.getLinks();
      assertExists(links.self);
      assertExists(links.delete);
      assertExists(links.search);
      assertExists(links.alternate);
    });
    
    await t.step("testResourceEmbedding - Test resource embedding", () => {
      // Create main resource
      const article = new Resource({
        type: "article",
        id: "123",
        properties: { title: "Main Article" }
      });
      
      // Create resources to embed
      const author = new Resource({
        type: "user",
        id: "u1",
        properties: { name: "John Doe" }
      });
      
      const comments = [
        new Resource({
          type: "comment",
          id: "c1",
          properties: { text: "Great article!" }
        }),
        new Resource({
          type: "comment",
          id: "c2",
          properties: { text: "Very informative." }
        })
      ];
      
      // Embed single resource
      article.embed("author", author);
      
      // Embed collection of resources
      article.embed("comments", comments);
      
      // Test getting embedded resources
      const embeddedAuthor = article.getEmbedded("author");
      assertExists(embeddedAuthor);
      if (Array.isArray(embeddedAuthor)) {
        assertEquals(embeddedAuthor.length, 1);
        assertEquals(embeddedAuthor[0].getType(), "user");
        assertEquals(embeddedAuthor[0].getId(), "u1");
        assertEquals(embeddedAuthor[0].getProperty("name"), "John Doe");
      }
      
      const embeddedComments = article.getEmbedded("comments");
      assertExists(embeddedComments);
      if (Array.isArray(embeddedComments)) {
        assertEquals(embeddedComments.length, 2);
        assertEquals(embeddedComments[0].getId(), "c1");
        assertEquals(embeddedComments[1].getId(), "c2");
      }
      
      // Test hasEmbedded
      assertEquals(article.hasEmbedded("author"), true);
      assertEquals(article.hasEmbedded("comments"), true);
      assertEquals(article.hasEmbedded("nonexistent"), false);
      
      // Test getEmbedded with no arguments
      const allEmbedded = article.getEmbedded() as Record<string, Resource[]>;
      assertExists(allEmbedded.author);
      assertExists(allEmbedded.comments);
      assertEquals(allEmbedded.author.length, 1);
      assertEquals(allEmbedded.comments.length, 2);
    });
    
    await t.step("testResourceStateTransitions - Test resource state transitions", () => {
      // Create resource with initial state
      const article = new Resource({
        type: "article",
        id: "123",
        initialState: "draft"
      });
      
      // Add state transitions
      article.addTransition("draft", "review", "submit", "/articles/123/submit", "POST");
      article.addTransition("review", "published", "approve", "/articles/123/approve", "POST");
      article.addTransition("review", "rejected", "reject", "/articles/123/reject", "POST");
      article.addTransition("rejected", "draft", "revise", "/articles/123/revise", "POST");
      
      // Test available transitions from initial state
      let transitions = article.getAvailableTransitions();
      assertEquals(transitions.length, 1);
      assertEquals(transitions[0].name, "submit");
      assertEquals(transitions[0].from, "draft");
      assertEquals(transitions[0].to, "review");
      
      // Apply transition
      article.applyTransition("submit");
      assertEquals(article.getState(), "review");
      
      // Test new available transitions
      transitions = article.getAvailableTransitions();
      assertEquals(transitions.length, 2);
      assertEquals(transitions[0].name, "approve");
      assertEquals(transitions[1].name, "reject");
      
      // Apply another transition
      article.applyTransition("reject");
      assertEquals(article.getState(), "rejected");
      
      // Test final transitions
      transitions = article.getAvailableTransitions();
      assertEquals(transitions.length, 1);
      assertEquals(transitions[0].name, "revise");
      
      // Test conditional transition
      const order = new Resource({
        type: "order",
        id: "o1",
        initialState: "new",
        properties: {
          paid: false,
          items: [{ id: "item1", quantity: 1 }]
        }
      });
      
      // Add transitions with conditions
      order.addTransition("new", "processing", "process", "/orders/o1/process", "POST", { paid: true });
      order.addTransition("new", "cancelled", "cancel", "/orders/o1/cancel", "POST");
      
      // Test available transitions with condition
      transitions = order.getAvailableTransitions();
      assertEquals(transitions.length, 1); // Only cancel is available
      assertEquals(transitions[0].name, "cancel");
      
      // Update property to satisfy condition
      order.setProperty("paid", true);
      
      // Now both transitions should be available
      transitions = order.getAvailableTransitions();
      assertEquals(transitions.length, 2);
      
      // Test invalid transition
      const invalidOrder = new Resource({
        type: "order",
        id: "o2",
        initialState: "new"
      });
      
      assertThrows(
        () => invalidOrder.applyTransition("nonexistent"),
        StateTransitionError,
        "No transition found with name 'nonexistent'"
      );
    });
    
    await t.step("testResourceSerialization - Test resource serialization", () => {
      // Create a complex resource for serialization testing
      const article = new Resource({
        type: "article",
        id: "123",
        properties: {
          title: "Test Article",
          content: "This is a test article with **markdown**.",
          published: true,
          tags: ["test", "example"],
          metadata: {
            created: "2023-01-01T00:00:00Z",
            author: "Jane Doe"
          }
        },
        initialState: "published"
      });
      
      // Add links
      article.addLink("self", "/articles/123");
      article.addLink("edit", "/articles/123/edit", "PUT");
      article.addLink("delete", "/articles/123", "DELETE");
      article.addTemplatedLink("search", "/articles{?tag}");
      
      // Add embedded resources
      const author = new Resource({
        type: "user",
        id: "u1",
        properties: { name: "Jane Doe" }
      });
      author.addLink("self", "/users/u1");
      
      const comments = [
        new Resource({
          type: "comment",
          id: "c1",
          properties: { text: "Comment 1" }
        }),
        new Resource({
          type: "comment",
          id: "c2",
          properties: { text: "Comment 2" }
        })
      ];
      comments[0].addLink("self", "/comments/c1");
      comments[1].addLink("self", "/comments/c2");
      
      article.embed("author", author);
      article.embed("comments", comments);
      
      // Add HAL-Forms template
      article.addTemplate("add-comment", {
        method: "POST",
        target: "/articles/123/comments",
        title: "Add Comment",
        properties: [
          {
            name: "text",
            type: "text",
            required: true,
            prompt: "Comment text"
          }
        ]
      });
      
      // Serialize to JSON
      const json = article.toJSON();
      
      // Verify basic properties
      assertEquals(json.type, "article");
      assertEquals(json.id, "123");
      assertEquals(json.state, "published");
      
      // Verify complex properties
      const props = json.properties as Record<string, unknown>;
      assertEquals(props.title, "Test Article");
      assertEquals(props.published, true);
      assertArrayIncludes(props.tags as string[], ["test", "example"]);
      assertEquals((props.metadata as Record<string, string>).author, "Jane Doe");
      
      // Verify links
      const links = json.links as Record<string, unknown>;
      assertExists(links.self);
      assertExists(links.edit);
      assertExists(links.delete);
      assertExists(links.search);
      
      // Verify embedded resources
      const embedded = json.embedded as Record<string, unknown[]>;
      assertExists(embedded.author);
      assertExists(embedded.comments);
      assertEquals(embedded.author.length, 1);
      assertEquals(embedded.comments.length, 2);
      assertEquals((embedded.author[0] as Record<string, string>).id, "u1");
      assertEquals((embedded.comments[0] as Record<string, string>).id, "c1");
      
      // Verify templates
      const templates = json._templates as Record<string, unknown>;
      assertExists(templates["add-comment"]);
    });
  });
  
  /**
   * Test Collection System
   */
  Deno.test("Collection System", async (t) => {
    await t.step("testCollectionCreation - Test collection creation and initialization", () => {
      // Create empty collection
      const emptyCollection = new Collection();
      assertEquals(emptyCollection.getType(), "collection");
      assertEquals(emptyCollection.getCount(), 0);
      
      // Create typed collection
      const typedCollection = new Collection({ type: "articles" });
      assertEquals(typedCollection.getType(), "articles");
      
      // Create collection with items
      const items = [
        new Resource({ type: "article", id: "1" }),
        new Resource({ type: "article", id: "2" })
      ];
      const itemCollection = new Collection({
        type: "articles",
        items
      });
      assertEquals(itemCollection.getCount(), 2);
      assertEquals(itemCollection.getItems(), items);
      
      // Create collection with pagination
      const paginatedCollection = new Collection({
        type: "articles",
        pagination: {
          page: 1,
          pageSize: 10,
          total: 42
        }
      });
      const pagination = paginatedCollection.getPagination();
      assertExists(pagination);
      assertEquals(pagination.page, 1);
      assertEquals(pagination.pageSize, 10);
      assertEquals(pagination.total, 42);
    });
    
    await t.step("testCollectionItemManagement - Test collection item management", () => {
      const collection = new Collection({ type: "articles" });
      
      // Test empty collection
      assertEquals(collection.getCount(), 0);
      assertEquals(collection.getItems().length, 0);
      
      // Add single item
      const item1 = new Resource({
        type: "article",
        id: "1",
        properties: { title: "Article 1", order: 3 }
      });
      collection.addItem(item1);
      assertEquals(collection.getCount(), 1);
      assertEquals(collection.getItems()[0], item1);
      
      // Add multiple items
      const item2 = new Resource({
        type: "article",
        id: "2",
        properties: { title: "Article 2", order: 1 }
      });
      const item3 = new Resource({
        type: "article",
        id: "3",
        properties: { title: "Article 3", order: 2 }
      });
      collection.addItems([item2, item3]);
      assertEquals(collection.getCount(), 3);
      
      // Invalid items
      assertThrows(
        () => collection.addItem(null as unknown as Resource),
        InvalidArgumentError
      );
      assertThrows(
        () => collection.addItems([new Resource(), null as unknown as Resource]),
        InvalidArgumentError
      );
      
      // Sort items
      collection.sort((a, b) => {
        return (a.getProperty("order") as number) - (b.getProperty("order") as number);
      });
      const sortedItems = collection.getItems();
      assertEquals(sortedItems[0].getId(), "2"); // order 1
      assertEquals(sortedItems[1].getId(), "3"); // order 2
      assertEquals(sortedItems[2].getId(), "1"); // order 3
      
      // Filter items
      const filteredItems = collection.filter(item => 
        (item.getProperty("order") as number) > 1
      );
      assertEquals(filteredItems.length, 2);
      assertEquals(filteredItems[0].getId(), "3");
      assertEquals(filteredItems[1].getId(), "1");
    });
    
    await t.step("testCollectionPagination - Test collection pagination", () => {
      const collection = new Collection({ type: "articles" });
      
      // Initial state
      assertEquals(collection.getPagination(), null);
      
      // Set pagination
      collection.setPagination({
        page: 2,
        pageSize: 10,
        total: 45
      });
      
      const pagination = collection.getPagination();
      assertExists(pagination);
      assertEquals(pagination.page, 2);
      assertEquals(pagination.pageSize, 10);
      assertEquals(pagination.total, 45);
      
      // Update pagination values individually
      collection.setPage(3);
      collection.setPageSize(20);
      collection.setTotal(50);
      
      const updatedPagination = collection.getPagination();
      assertExists(updatedPagination);
      assertEquals(updatedPagination.page, 3);
      assertEquals(updatedPagination.pageSize, 20);
      assertEquals(updatedPagination.total, 50);
      
      // Add pagination links
      collection.addPaginationLinks("/api/articles");
      
      // Check links
      const links = collection.getLinks();
      assertExists(links.first);
      assertExists(links.prev);
      assertExists(links.last);
      
      // Verify link URLs
      if (!Array.isArray(links.first)) {
        assertEquals(links.first.href, "/api/articles?page=1&pageSize=20");
      }
      if (!Array.isArray(links.prev)) {
        assertEquals(links.prev.href, "/api/articles?page=2&pageSize=20");
      }
      // No next link should exist since we're on the last page
      assertEquals(links.next, undefined);
      if (!Array.isArray(links.last)) {
        // Total pages = 50/20 = 3 (rounded up)
        assertEquals(links.last.href, "/api/articles?page=3&pageSize=20");
      }
      
      // Collection name
      assertEquals(collection.getCollectionName(), "items"); // Default
      collection.setCollectionName("articles");
      assertEquals(collection.getCollectionName(), "articles");
    });
    
    await t.step("testCollectionSerialization - Test collection serialization", () => {
      // Create items
      const items = [
        new Resource({
          type: "article",
          id: "1",
          properties: { title: "Article 1" }
        }),
        new Resource({
          type: "article",
          id: "2",
          properties: { title: "Article 2" }
        })
      ];
      
      // Add links to items
      items[0].addLink("self", "/articles/1");
      items[1].addLink("self", "/articles/2");
      
      // Create collection
      const collection = new Collection({
        type: "articles",
        items,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 42
        }
      });
      
      // Set collection name
      collection.setCollectionName("articles");
      
      // Add links
      collection.addLink("self", "/articles");
      collection.addPaginationLinks("/articles");
      
      // Serialize to JSON
      const json = collection.toJSON();
      
      // Verify basic properties
      assertEquals(json.type, "articles");
      
      // Verify links
      const links = json.links as Record<string, unknown>;
      assertExists(links.self);
      assertExists(links.first);
      assertExists(links.last);
      
      // Verify embedded items
      const embedded = json.embedded as Record<string, unknown[]>;
      assertExists(embedded.articles); // Uses the collection name
      assertEquals(embedded.articles.length, 2);
      
      // Verify pagination
      const pagination = json.pagination as Record<string, number>;
      assertEquals(pagination.page, 1);
      assertEquals(pagination.pageSize, 10);
      assertEquals(pagination.total, 42);
    });
  });
  
  /**
   * Test Link Management
   */
  Deno.test("Link Management", async (t) => {
    await t.step("testLinkCreation - Test link creation and retrieval", () => {
      // Create empty link manager
      const manager = new LinkManager();
      assertEquals(Object.keys(manager.getLinks()).length, 0);
      
      // Add link
      manager.addLink("self", "/resource/1");
      const links = manager.getLinks();
      assertEquals(Object.keys(links).length, 1);
      assertExists(links.self);
      
      // Get link
      const link = manager.getLink("self");
      assertExists(link);
      if (!Array.isArray(link)) {
        assertEquals(link.href, "/resource/1");
        assertEquals(link.method, "GET"); // Default
        assertEquals(link.rel, "self");
      }
      
      // Standard relations
      assertEquals(STANDARD_RELS.SELF, "self");
      assertEquals(STANDARD_RELS.EDIT, "edit");
      assertEquals(STANDARD_RELS.DELETE, "delete");
      
      manager.addLink(STANDARD_RELS.EDIT, "/resource/1/edit", "PUT");
      const editLink = manager.getLink(STANDARD_RELS.EDIT);
      assertExists(editLink);
      if (!Array.isArray(editLink)) {
        assertEquals(editLink.href, "/resource/1/edit");
        assertEquals(editLink.method, "PUT");
      }
    });
    
    await t.step("testLinkOptions - Test link options and attributes", () => {
      const manager = new LinkManager();
      
      // Add link with custom method
      manager.addLink("edit", "/resource/1/edit", "PUT");
      const editLink = manager.getLink("edit");
      assertExists(editLink);
      if (!Array.isArray(editLink)) {
        assertEquals(editLink.method, "PUT");
      }
      
      // Add link with full options
      manager.addLink("docs", "/resource/1/docs", "GET", {
        title: "Documentation",
        type: "text/html",
        hreflang: "en",
        templated: false,
        attrs: {
          target: "_blank",
          rel: "noopener"
        }
      });
      
      const docsLink = manager.getLink("docs");
      assertExists(docsLink);
      if (!Array.isArray(docsLink)) {
        assertEquals(docsLink.title, "Documentation");
        assertEquals(docsLink.type, "text/html");
        assertEquals(docsLink.hreflang, "en");
        assertEquals(docsLink.templated, false);
        assertEquals(docsLink.attrs?.target, "_blank");
        assertEquals(docsLink.attrs?.rel, "noopener");
      }
      
      // Add templated link
      manager.addLink("search", "/resource/search{?q}", "GET", {
        templated: true,
        title: "Search Resources"
      });
      
      const searchLink = manager.getLink("search");
      assertExists(searchLink);
      if (!Array.isArray(searchLink)) {
        assertEquals(searchLink.href, "/resource/search{?q}");
        assertEquals(searchLink.templated, true);
        assertEquals(searchLink.title, "Search Resources");
      }
    });
    
    await t.step("testLinkManager - Test link manager functionality", () => {
      // Initial links
      const initialLinks = {
        self: { rel: "self", href: "/resource/1", method: "GET" },
        edit: { rel: "edit", href: "/resource/1/edit", method: "PUT" }
      };
      const manager = new LinkManager(initialLinks);
      
      // Check links
      assertEquals(Object.keys(manager.getLinks()).length, 2);
      assertExists(manager.getLink("self"));
      assertExists(manager.getLink("edit"));
      
      // Add multiple links with same relation
      manager.addLink("alternate", "/resource/1.json", "GET", { type: "application/json" });
      manager.addLink("alternate", "/resource/1.xml", "GET", { type: "application/xml" });
      
      const alternateLinks = manager.getLink("alternate");
      assertExists(alternateLinks);
      if (Array.isArray(alternateLinks)) {
        assertEquals(alternateLinks.length, 2);
        assertEquals(alternateLinks[0].type, "application/json");
        assertEquals(alternateLinks[1].type, "application/xml");
      }
      
      // Remove link
      manager.removeLink("edit");
      assertEquals(manager.hasLink("edit"), false);
      
      // Set self link
      manager.setSelfLink("/resource/2");
      const selfLink = manager.getLink("self");
      assertExists(selfLink);
      if (!Array.isArray(selfLink)) {
        assertEquals(selfLink.href, "/resource/2");
      }
      
      // Get link relations
      const relations = manager.getLinkRelations();
      assertArrayIncludes(relations, ["self", "alternate"]);
      assertArrayIncludes(relations, ["self", "alternate"]);
      
      // Link builder
      const builder = LinkManager.createLinkBuilder("https://api.example.com");
      const builtLink = builder("/resources/1", "self");
      assertEquals(builtLink.href, "https://api.example.com/resources/1");
      assertEquals(builtLink.rel, "self");
      assertEquals(builtLink.method, "GET");
      
      // Clone manager
      const clone = manager.clone();
      assertEquals(Object.keys(clone.getLinks()).length, Object.keys(manager.getLinks()).length);
      assertExists(clone.getLink("self"));
      assertExists(clone.getLink("alternate"));
      
      // Invalid inputs
      assertThrows(
        () => manager.addLink("", "/resource"),
        InvalidArgumentError,
        "Link relation must be a non-empty string"
      );
      
      assertThrows(
        () => manager.addLink("relation", ""),
        InvalidArgumentError, 
        "Link href must be a non-empty string"
      );
    });
  });
  
  /**
   * Test State Machine
   */
  Deno.test("State Machine", async (t) => {
    await t.step("testStateTransitions - Test state transitions management", () => {
      // Create state machine with initial state
      const stateMachine = new ResourceState("draft");
      assertEquals(stateMachine.getState(), "draft");
      
      // Add transitions
      stateMachine.addTransition("draft", "review", "submit", "/article/1/submit", "POST");
      stateMachine.addTransition("review", "published", "approve", "/article/1/approve", "POST");
      stateMachine.addTransition("review", "draft", "revise", "/article/1/revise", "POST");
      
      // Get all transitions
      const allTransitions = stateMachine.getTransitions();
      assertEquals(allTransitions.length, 3);
      
      // Get available transitions
      const availableTransitions = stateMachine.getAvailableTransitions("draft");
      assertEquals(availableTransitions.length, 1);
      assertEquals(availableTransitions[0].name, "submit");
      assertEquals(availableTransitions[0].from, "draft");
      assertEquals(availableTransitions[0].to, "review");
      
      // Apply transition
      const newState = stateMachine.applyTransition("submit", "draft");
      assertEquals(newState, "review");
      stateMachine.setState(newState);
      assertEquals(stateMachine.getState(), "review");
      
      // Get new available transitions
      const reviewTransitions = stateMachine.getAvailableTransitions("review");
      assertEquals(reviewTransitions.length, 2);
      
      // Test conditional transitions
      const orderState = new ResourceState("new");
      orderState.addTransition("new", "processing", "process", "/order/1/process", "POST", {
        paid: true
      });
      orderState.addTransition("new", "cancelled", "cancel", "/order/1/cancel", "POST");
      
      // Without meeting condition
      const newTransitions = orderState.getAvailableTransitions("new", { paid: false });
      assertEquals(newTransitions.length, 1);
      assertEquals(newTransitions[0].name, "cancel");
      
      // Meeting condition
      const paidTransitions = orderState.getAvailableTransitions("new", { paid: true });
      assertEquals(paidTransitions.length, 2);
      
      // Invalid transition
      assertThrows(
        () => orderState.applyTransition("nonexistent", "new"),
        StateTransitionError,
        "No transition found with name 'nonexistent'"
      );
      
      // Clone state machine
      const clone = stateMachine.clone();
      assertEquals(clone.getState(), "review");
      assertEquals(clone.getTransitions().length, 3);
    });
    
    await t.step("testComplexStateFlows - Test complex state machine flows", () => {
      // Order state machine
      const orderState = new ResourceState("cart");
      
      // Define full order flow
      orderState.addTransition("cart", "checkout", "checkout", "/order/checkout", "POST");
      orderState.addTransition("checkout", "payment", "initiate-payment", "/order/payment", "POST");
      orderState.addTransition("checkout", "cart", "edit-cart", "/order/edit", "GET");
      orderState.addTransition("payment", "processing", "complete-payment", "/order/payment/complete", "POST");
      orderState.addTransition("payment", "checkout", "change-payment", "/order/payment/change", "GET");
      orderState.addTransition("payment", "cancelled", "cancel", "/order/cancel", "POST");
      orderState.addTransition("processing", "fulfilled", "fulfill", "/order/fulfill", "POST");
      orderState.addTransition("processing", "cancelled", "cancel", "/order/cancel", "POST");
      orderState.addTransition("fulfilled", "complete", "complete", "/order/complete", "POST");
      
      // Add conditional transitions
      orderState.addTransition("processing", "refunded", "refund", "/order/refund", "POST", {
        paymentMethod: "credit-card"
      });
      
      // Test transition flow
      assertEquals(orderState.getState(), "cart");
      
      // Move through multiple states
      orderState.setState(orderState.applyTransition("checkout", "cart"));
      assertEquals(orderState.getState(), "checkout");
      
      orderState.setState(orderState.applyTransition("initiate-payment", "checkout"));
      assertEquals(orderState.getState(), "payment");
      
      orderState.setState(orderState.applyTransition("complete-payment", "payment"));
      assertEquals(orderState.getState(), "processing");
      
      // Test conditional transition
      const refundTransitions = orderState.getAvailableTransitions("processing", {
        paymentMethod: "credit-card"
      });
      assertEquals(refundTransitions.length, 3); // refund, fulfill, cancel
      
      const noRefundTransitions = orderState.getAvailableTransitions("processing", {
        paymentMethod: "paypal"
      });
      assertEquals(noRefundTransitions.length, 2); // fulfill, cancel
      
      // Complete the flow
      orderState.setState(orderState.applyTransition("fulfill", "processing"));
      assertEquals(orderState.getState(), "fulfilled");
      
      orderState.setState(orderState.applyTransition("complete", "fulfilled"));
      assertEquals(orderState.getState(), "complete");
      
      // No transitions from final state
      const finalTransitions = orderState.getAvailableTransitions("complete");
      assertEquals(finalTransitions.length, 0);
    });
  });
  
  /**
   * Test Middleware System
   */
  Deno.test("Middleware System", async (t) => {
    await t.step("testMiddlewareChain - Test middleware chain creation and execution", async () => {
      const chain = new MiddlewareChain();
      const executionOrder: string[] = [];
      
      // Add middleware functions
      chain.use(async (req, ctx, next) => {
        executionOrder.push("middleware1:before");
        const response = await next();
        executionOrder.push("middleware1:after");
        return response;
      });
      
      chain.use(async (req, ctx, next) => {
        executionOrder.push("middleware2:before");
        const response = await next();
        executionOrder.push("middleware2:after");
        return response;
      });
      
      chain.use(async (req, ctx, next) => {
        executionOrder.push("middleware3:before");
        const response = await next();
        executionOrder.push("middleware3:after");
        return response;
      });
      
      // Final handler
      const finalHandler = async () => {
        executionOrder.push("handler");
        return new Response("OK");
      };
      
      // Execute chain
      const request = new Request("https://example.com");
      const context = { params: {}, state: {} };
      const response = await chain.execute(request, context, finalHandler);
      
      // Verify execution order
      assertEquals(executionOrder, [
        "middleware1:before",
        "middleware2:before",
        "middleware3:before",
        "handler",
        "middleware3:after",
        "middleware2:after",
        "middleware1:after"
      ]);
      
      // Verify response
      assertEquals(await response.text(), "OK");
    });
    
    await t.step("testMiddlewareContext - Test middleware context state", async () => {
      const chain = new MiddlewareChain();
      
      // Authentication middleware
      chain.use(async (req, ctx, next) => {
        // Set user in context
        ctx.state.user = { id: "user1", role: "admin" };
        return await next();
      });
      
      // Authorization middleware
      chain.use(async (req, ctx, next) => {
        // Check user role
        const user = ctx.state.user as { id: string; role: string };
        ctx.state.isAdmin = user.role === "admin";
        return await next();
      });
      
      // Request time middleware
      chain.use(async (req, ctx, next) => {
        ctx.state.requestTime = "2023-01-01T00:00:00Z";
        return await next();
      });
      
      // Final handler
      const finalHandler = async () => {
        // Not using context in this test
        return new Response("OK");
      };
      
      // Execute chain
      const request = new Request("https://example.com");
      const context = { params: {}, state: {} };
      await chain.execute(request, context, finalHandler);
      
      // Verify context state
      assertEquals((context.state.user as { id: string }).id, "user1");
      assertEquals(context.state.isAdmin, true);
      assertEquals(context.state.requestTime, "2023-01-01T00:00:00Z");
    });
    
    await t.step("testMiddlewareErrorHandling - Test middleware error handling", async () => {
      const chain = new MiddlewareChain();
      
      // Add middleware that will throw an error
      chain.use(async (req, ctx, next) => {
        throw new ValidationError("Validation failed", "INVALID_INPUT", {
          field: "email",
          message: "Invalid email format"
        });
      });
      
      // Add middleware that should never execute
      chain.use(async (req, ctx, next) => {
        ctx.state.neverReached = true;
        return await next();
      });
      
      // Final handler
      const finalHandler = async () => {
        return new Response("OK");
      };
      
      // Execute chain and catch error
      const request = new Request("https://example.com");
      const context = { params: {}, state: {} };
      
      try {
        await chain.execute(request, context, finalHandler);
        // Should never reach here
        assertEquals(true, false);
      } catch (error) {
        // Verify error
        assertEquals(error instanceof ValidationError, true);
        assertEquals((error as ValidationError).message, "Validation failed");
        assertEquals((error as ValidationError).code, "INVALID_INPUT");
        assertEquals((error as ValidationError).details?.field, "email");
      }
      
      // Verify middleware execution stopped
      assertEquals(context.state.neverReached, undefined);
      
      // Test error recovery middleware
      const recoveryChain = new MiddlewareChain();
      
      // Add middleware that will throw an error
      recoveryChain.use(async (req, ctx, next) => {
        try {
          return await next();
        } catch (error) {
          // Recover from error
          ctx.state.recovered = true;
          ctx.state.errorMessage = (error as Error).message;
          // Return error response
          return new Response("Error recovered", { status: 400 });
        }
      });
      
      // Add middleware that throws
      recoveryChain.use(async (req, ctx, next) => {
        throw new Error("Test error");
      });
      
      // Execute chain with error recovery
      const recoveryContext = { params: {}, state: {} };
      const recoveryResponse = await recoveryChain.execute(request, recoveryContext, finalHandler);
      
      // Verify error recovery
      assertEquals(recoveryContext.state.recovered, true);
      assertEquals(recoveryContext.state.errorMessage, "Test error");
      assertEquals(await recoveryResponse.text(), "Error recovered");
      assertEquals(recoveryResponse.status, 400);
    });
  });
  
  /**
   * Test Plugin System
   */
  Deno.test("Plugin System", async (t) => {
    await t.step("testPluginRegistration - Test plugin registration and initialization", () => {
      const pluginManager = new PluginManager();
      
      // Create plugins
      const plugin1 = {
        name: "plugin1",
        version: "1.0.0",
        initialize: (app: unknown) => {
          // Do nothing in this test
        }
      };
      
      const plugin2 = {
        name: "plugin2",
        version: "1.0.0",
        hooks: {
          [HookType.BEFORE_ROUTE_HANDLE]: () => {
            // Do nothing in this test
          }
        }
      };
      
      // Register plugins
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      // Check registered plugins
      const plugins = pluginManager.getPlugins();
      assertEquals(plugins.length, 2);
      assertEquals(plugins[0].name, "plugin1");
      assertEquals(plugins[1].name, "plugin2");
      
      // Test duplicate registration
      assertThrows(
        () => pluginManager.registerPlugin(plugin1),
        InvalidArgumentError,
        'Plugin "plugin1" is already registered'
      );
      
      // Test invalid plugin
      assertThrows(
        () => pluginManager.registerPlugin({ version: "1.0.0" } as any),
        InvalidArgumentError,
        "Plugin must have a name"
      );
      
      // Test initialization
      let initCalled = false;
      const appMock = {};
      
      const initPlugin = {
        name: "initPlugin",
        initialize: (_app: unknown) => {
          initCalled = true;
        }
      };
      
      pluginManager.registerPlugin(initPlugin);
      pluginManager.initializePlugins(appMock);
      
      assertEquals(initCalled, true);
    });
    
    await t.step("testPluginHooks - Test plugin hooks execution", () => {
      const pluginManager = new PluginManager();
      
      // Hook results
      const hookResults: Record<string, unknown> = {};
      
      // Create plugins with hooks
      const plugin1 = {
        name: "plugin1",
        hooks: {
          [HookType.BEFORE_RESOURCE_CREATE]: (data: unknown) => {
            hookResults.beforeCreate1 = data;
            return { ...data as object, modified: true };
          }
        }
      };
      
      const plugin2 = {
        name: "plugin2",
        hooks: {
          [HookType.BEFORE_RESOURCE_CREATE]: (data: unknown) => {
            hookResults.beforeCreate2 = data;
            return { ...data as object, plugin2: true };
          },
          [HookType.AFTER_RESOURCE_CREATE]: (resource: unknown) => {
            hookResults.afterCreate = resource;
          }
        }
      };
      
      // Register plugins
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      // Execute hooks
      const data = { type: "article", id: "123" };
      const results = pluginManager.executeHook(HookType.BEFORE_RESOURCE_CREATE, data);
      
      // Check hook execution
      assertEquals(results.length, 2);
      assertEquals(hookResults.beforeCreate1, data);
      assertEquals(hookResults.beforeCreate2, data);
      assertEquals((results[0] as Record<string, unknown>).modified, true);
      assertEquals((results[1] as Record<string, unknown>).plugin2, true);
      
      // Execute another hook
      const resource = new Resource({ type: "article", id: "123" });
      pluginManager.executeHook(HookType.AFTER_RESOURCE_CREATE, resource);
      
      // Check hook execution
      assertEquals(hookResults.afterCreate, resource);
      
      // Execute non-existent hook
      const emptyResults = pluginManager.executeHook("nonexistentHook", {});
      assertEquals(emptyResults.length, 0);
    });
    
    await t.step("testPluginMiddleware - Test plugin middleware integration", () => {
      const pluginManager = new PluginManager();
      
      // Create plugin with middleware
      const plugin = {
        name: "middlewarePlugin",
        middlewares: [
          async (request: Request, context: Record<string, unknown>, next: () => Promise<Response>) => {
            context.state = context.state || {};
            (context.state as Record<string, unknown>).pluginMiddleware = true;
            const response = await next();
            return response;
          }
        ]
      };
      
      // Register plugin
      pluginManager.registerPlugin(plugin);
      
      // Get middlewares
      const middlewares = pluginManager.getMiddlewares();
      assertEquals(middlewares.length, 1);
      
      // Execute middleware
      const context = { state: {} };
      const request = new Request("https://example.com");
      const next = async () => new Response("OK");
      
      middlewares[0](request, context as any, next);
      
      // Check middleware execution
      assertEquals(context.state.pluginMiddleware, true);
    });
  });
  
  /**
   * Test HAL-Forms Support
   */
  Deno.test("HAL-Forms", async (t) => {
    await t.step("testHalFormTemplates - Test HAL-Form templates", () => {
      // Create basic form
      const form1 = {
        method: "POST",
        target: "/articles",
        title: "Create Article",
        properties: [
          {
            name: "title",
            type: "text",
            required: true,
            prompt: "Article Title"
          },
          {
            name: "content",
            type: "text",
            required: true,
            prompt: "Article Content"
          }
        ]
      };
      
      // Create form with options
      const form2 = {
        method: "PUT",
        target: "/articles/123",
        title: "Update Article",
        properties: [
          {
            name: "status",
            type: "text",
            required: true,
            prompt: "Article Status",
            options: {
              inline: [
                { value: "draft", prompt: "Draft" },
                { value: "published", prompt: "Published" }
              ]
            }
          }
        ]
      };
      
      // Create resource with forms
      const resource = new Resource({
        type: "article",
        id: "123"
      });
      
      // Add forms
      resource.addTemplate("create", form1);
      resource.addTemplate("update", form2);
      
      // Verify forms
      const templates = resource.getTemplates();
      assertExists(templates.create);
      assertExists(templates.update);
      
      // Check template properties
      assertEquals(templates.create.method, "POST");
      assertEquals(templates.create.title, "Create Article");
      assertEquals(templates.create.properties.length, 2);
      
      assertEquals(templates.update.method, "PUT");
      assertEquals(templates.update.properties[0].name, "status");
      assertExists(templates.update.properties[0].options);
      assertEquals(templates.update.properties[0].options?.inline?.length, 2);
      
      // Test has template
      assertEquals(resource.hasTemplate("create"), true);
      assertEquals(resource.hasTemplate("nonexistent"), false);
      
      // Test get template
      const template = resource.getTemplate("create");
      assertExists(template);
      assertEquals(template.properties.length, 2);
      
      // Test remove template
      resource.removeTemplate("create");
      assertEquals(resource.hasTemplate("create"), false);
    });
    
    await t.step("testHalFormActions - Test HAL-Form actions", () => {
      // Create resource
      const resource = new Resource({
        type: "article",
        id: "123"
      });
      
      // Add self link (for action target)
      resource.addLink("self", "/articles/123");
      
      // Add action with explicit target
      resource.addAction(
        "add-comment",
        "POST",
        [
          {
            name: "text",
            type: "text",
            required: true,
            prompt: "Comment Text"
          }
        ],
        "/articles/123/comments",
        "Add Comment"
      );
      
      // Add action with implicit target (uses self link)
      resource.addAction(
        "publish",
        "PUT",
        [
          {
            name: "publishDate",
            type: "date",
            prompt: "Publish Date"
          }
        ],
        undefined,
        "Publish Article"
      );
      
      // Verify templates
      const templates = resource.getTemplates();
      assertExists(templates["add-comment"]);
      assertExists(templates.publish);
      
      // Check template properties
      assertEquals(templates["add-comment"].method, "POST");
      assertEquals(templates["add-comment"].target, "/articles/123/comments");
      assertEquals(templates["add-comment"].title, "Add Comment");
      assertEquals(templates["add-comment"].properties.length, 1);
      assertEquals(templates["add-comment"].properties[0].name, "text");
      
      assertEquals(templates.publish.method, "PUT");
      assertEquals(templates.publish.target, "/articles/123"); // Uses self link
      assertEquals(templates.publish.title, "Publish Article");
      assertEquals(templates.publish.properties.length, 1);
      assertEquals(templates.publish.properties[0].name, "publishDate");
      assertEquals(templates.publish.properties[0].type, "date");
      
      // Check serialization
      const json = resource.toJSON();
      assertExists(json._templates);
      assertExists((json._templates as Record<string, unknown>)["add-comment"]);
      assertExists((json._templates as Record<string, unknown>).publish);
    });
  });
  
  /**
   * Test Router
   */
  Deno.test("Router", async (t) => {
    await t.step("testRouterRegistration - Test router registration", () => {
      const pluginManager = new PluginManager();
      const router = new Router(pluginManager);
      
      // Register GET route
      router.get("/test", () => new Response("GET Test"));
      
      // Register POST route
      router.post("/test", () => new Response("POST Test"));
      
      // Register PUT route
      router.put("/test", () => new Response("PUT Test"));
      
      // Register DELETE route
      router.delete("/test", () => new Response("DELETE Test"));
      
      // Register PATCH route
      router.patch("/test", () => new Response("PATCH Test"));
      
      // Register OPTIONS route
      router.options("/test", () => new Response("OPTIONS Test"));
      
      // Register HEAD route
      router.head("/test", () => new Response("HEAD Test"));
      
      // Register route with parameters
      router.get("/users/:id", (req, params) => {
        return new Response(`User ID: ${params.id}`);
      });
      
      // Register route with regex
      router.get(/^\/items\/(\d+)$/, () => {
        return new Response("Item Route");
      });
      
      // Register catch-all route
      router.all("*", () => new Response("Catch All"));
    });
    
    await t.step("testRouterHandling - Test router request handling", async () => {
      const router = new Router();
      
      // Register routes
      router.get("/test", () => new Response("GET Test"));
      router.post("/test", () => new Response("POST Test"));
      
      router.get("/users/:id", (req, params) => {
        return new Response(`User ID: ${params.id}`);
      });
      
      router.get("/nested/:category/:id", (req, params) => {
        return new Response(`Category: ${params.category}, ID: ${params.id}`);
      });
      
      router.get(/^\/items\/(\d+)$/, () => {
        return new Response("Item Route");
      });
      
      // Test GET route
      let request = new Request("http://example.com/test");
      let response = await router.handle(request);
      assertEquals(await response.text(), "GET Test");
      assertEquals(response.status, 200);
      
      // Test POST route
      request = new Request("http://example.com/test", { method: "POST" });
      response = await router.handle(request);
      assertEquals(await response.text(), "POST Test");
      
      // Test route with parameter
      request = new Request("http://example.com/users/123");
      response = await router.handle(request);
      assertEquals(await response.text(), "User ID: 123");
      
      // Test route with multiple parameters
      request = new Request("http://example.com/nested/products/456");
      response = await router.handle(request);
      assertEquals(await response.text(), "Category: products, ID: 456");
      
      // Test regex route
      request = new Request("http://example.com/items/789");
      response = await router.handle(request);
      assertEquals(await response.text(), "Item Route");
      
      // Test not found
      request = new Request("http://example.com/nonexistent");
      response = await router.handle(request);
      assertEquals(response.status, 404);
    });
    
    await t.step("testResourceRoutes - Test RESTful resource routes", async () => {
      const router = new Router();
      
      // Register resource routes
      router.resource("/articles", {
        // List all resources
        list: () => createResponse(createCollection({
          type: "articles",
          items: [
            createResource({ type: "article", id: "1", properties: { title: "Article 1" } }),
            createResource({ type: "article", id: "2", properties: { title: "Article 2" } })
          ]
        })),
        
        // Get a single resource
        get: (req, params) => createResponse(createResource({
          type: "article",
          id: params.id,
          properties: { title: `Article ${params.id}` }
        })),
        
        // Create a resource
        create: () => createResponse(createResource({
          type: "article",
          id: "new",
          properties: { title: "New Article" }
        }), { status: 201 }),
        
        // Update a resource
        update: (req, params) => createResponse(createResource({
          type: "article",
          id: params.id,
          properties: { title: `Updated Article ${params.id}` }
        })),
        
        // Delete a resource
        delete: () => new Response(null, { status: 204 })
      });
      
      // Test list route
      let request = new Request("http://example.com/articles");
      let response = await router.handle(request);
      assertEquals(response.status, 200);
      let body = await response.json();
      assertEquals(body.type, "articles");
      assertEquals((body.embedded as Record<string, unknown[]>).items.length, 2);
      
      // Test get route
      request = new Request("http://example.com/articles/1");
      response = await router.handle(request);
      assertEquals(response.status, 200);
      body = await response.json();
      assertEquals(body.type, "article");
      assertEquals(body.id, "1");
      assertEquals((body.properties as Record<string, string>).title, "Article 1");
      
      // Test create route
      request = new Request("http://example.com/articles", { method: "POST" });
      response = await router.handle(request);
      assertEquals(response.status, 201);
      body = await response.json();
      assertEquals(body.type, "article");
      assertEquals(body.id, "new");
      
      // Test update route
      request = new Request("http://example.com/articles/1", { method: "PUT" });
      response = await router.handle(request);
      assertEquals(response.status, 200);
      body = await response.json();
      assertEquals(body.type, "article");
      assertEquals(body.id, "1");
      assertEquals((body.properties as Record<string, string>).title, "Updated Article 1");
      
      // Test delete route
      request = new Request("http://example.com/articles/1", { method: "DELETE" });
      response = await router.handle(request);
      assertEquals(response.status, 204);
    });
    
    await t.step("testRouterErrorHandling - Test router error handling", async () => {
      const router = new Router();
      
      // Register route that throws error
      router.get("/error", () => {
        throw new ValidationError("Test validation error");
      });
      
      // Register route that throws non-API error
      router.get("/generic-error", () => {
        throw new Error("Generic error");
      });
      
      // Set custom error handler
      router.setErrorHandler((error) => {
        if (error instanceof ApiError) {
          return new Response(`Custom error handler: ${error.message}`, { 
            status: error.status,
            headers: { "Content-Type": "text/plain" }
          });
        }
        return new Response(`Unknown error: ${error.message}`, { status: 500 });
      });
      
      // Set custom not found handler
      router.setNotFoundHandler(() => {
        return new Response("Custom not found page", { 
          status: 404,
          headers: { "Content-Type": "text/plain" }
        });
      });
      
      // Test API error
      let request = new Request("http://example.com/error");
      let response = await router.handle(request);
      assertEquals(response.status, 400); // ValidationError status
      assertEquals(await response.text(), "Custom error handler: Test validation error");
      
      // Test generic error
      request = new Request("http://example.com/generic-error");
      response = await router.handle(request);
      assertEquals(response.status, 500);
      assertEquals(await response.text(), "Unknown error: Generic error");
      
      // Test not found
      request = new Request("http://example.com/nonexistent");
      response = await router.handle(request);
      assertEquals(response.status, 404);
      assertEquals(await response.text(), "Custom not found page");
    });
  });
  
  /**
   * Test Content Negotiation
   */
  Deno.test("Content Negotiation", async (t) => {
    await t.step("testContentNegotiationParsing - Test Accept header parsing", () => {
      // Create request with Accept header
      const headers = new Headers();
      headers.set("Accept", "text/html;q=0.8, application/json;q=1.0, */*;q=0.1");
      const request = new Request("http://example.com", { headers });
      
      // Available media types
      const availableTypes = [
        MEDIA_TYPES.JSON,
        MEDIA_TYPES.HTML,
        MEDIA_TYPES.TEXT
      ];
      
      // Negotiate content type
      const mediaType = negotiateContentType(request, availableTypes);
      
      // Should select JSON due to highest quality value
      assertEquals(mediaType, MEDIA_TYPES.JSON);
      
      // Create request with no matching types
      const htmlOnlyHeaders = new Headers();
      htmlOnlyHeaders.set("Accept", "text/html");
      const htmlOnlyRequest = new Request("http://example.com", { headers: htmlOnlyHeaders });
      
      // Negotiate with no matching types
      assertThrows(
        () => negotiateContentType(htmlOnlyRequest, [MEDIA_TYPES.JSON, MEDIA_TYPES.HAL_JSON]),
        ContentNegotiationError
      );
      
      // Create request with * wildcard
      const wildcardHeaders = new Headers();
      wildcardHeaders.set("Accept", "*/*");
      const wildcardRequest = new Request("http://example.com", { headers: wildcardHeaders });
      
      // Negotiate with wildcard
      const wildcardType = negotiateContentType(wildcardRequest, availableTypes);
      assertEquals(wildcardType, availableTypes[0]); // First available type
      
      // Create request with type wildcard
      const typeWildcardHeaders = new Headers();
      typeWildcardHeaders.set("Accept", "text/*");
      const typeWildcardRequest = new Request("http://example.com", { headers: typeWildcardHeaders });
      
      // Negotiate with type wildcard
      const typeWildcardResult = negotiateContentType(typeWildcardRequest, availableTypes);
      assertEquals(typeWildcardResult, MEDIA_TYPES.TEXT); // Matches text/*
    });
    
    await t.step("testContentTypeSelection - Test content type selection", () => {
      // Create URL with format parameter
      const url = new URL("http://example.com?format=hal");
      const headers = new Headers();
      headers.set("Accept", "application/json");
      const request = new Request(url.toString(), { headers });
      
      // Available media types
      const availableTypes = [
        MEDIA_TYPES.JSON,
        MEDIA_TYPES.HAL_JSON,
        MEDIA_TYPES.TEXT
      ];
      
      // Negotiate content type
      const mediaType = negotiateContentType(request, availableTypes);
      
      // Should select HAL+JSON due to format parameter override
      assertEquals(mediaType, MEDIA_TYPES.HAL_JSON);
      
      // Create URL with unsupported format
      const unsupportedUrl = new URL("http://example.com?format=xml");
      const unsupportedRequest = new Request(unsupportedUrl.toString());
      
      // Negotiate with unsupported format
      assertThrows(
        () => negotiateContentType(unsupportedRequest, availableTypes),
        ContentNegotiationError
      );
      
      // Format to media type mapping
      assertEquals(FORMAT_MAP.json, MEDIA_TYPES.JSON);
      assertEquals(FORMAT_MAP.hal, MEDIA_TYPES.HAL_JSON);
      assertEquals(FORMAT_MAP.html, MEDIA_TYPES.HTML);
      assertEquals(FORMAT_MAP.text, MEDIA_TYPES.TEXT);
    });
  });
  
  /**
   * Test Renderer System
   */
  Deno.test("Renderer System", async (t) => {
    await t.step("testBuiltInRenderers - Test built-in renderers", async () => {
      // Create sample resource
      const resource = createResource({
        type: "article",
        id: "123",
        properties: {
          title: "Test Article",
          content: "Article content"
        },
        links: {
          self: "/articles/123",
          collection: "/articles"
        }
      });
      
      // Import the renderers directly from their implementations
      const JsonRenderer = HyperDeno["JsonRenderer"];
      const HalRenderer = HyperDeno["HalRenderer"];
      const TextRenderer = HyperDeno["TextRenderer"];
      
      // Create renderer instances
      const jsonRenderer = new JsonRenderer();
      const halRenderer = new HalRenderer();
      const textRenderer = new TextRenderer();
      
      // Test JSON renderer
      const jsonResponse = jsonRenderer.render(resource);
      assertEquals(jsonResponse.headers.get("Content-Type"), MEDIA_TYPES.JSON);
      const jsonBody = await jsonResponse.json();
      assertEquals(jsonBody.type, "article");
      assertEquals(jsonBody.id, "123");
      assertEquals(jsonBody.properties.title, "Test Article");
      assertExists(jsonBody.links);
      assertExists(jsonBody.links.self);
      
      // Test HAL renderer
      const halResponse = halRenderer.render(resource);
      assertEquals(halResponse.headers.get("Content-Type"), MEDIA_TYPES.HAL_JSON);
      const halBody = await halResponse.json();
      assertEquals(halBody.type, "article");
      assertEquals(halBody.id, "123");
      assertExists(halBody._links); // HAL format uses _links
      assertExists(halBody._links.self);
      
      // Test Text renderer
      const textResponse = textRenderer.render(resource);
      assertEquals(textResponse.headers.get("Content-Type"), "text/plain");
      const textBody = await textResponse.text();
      assertStringIncludes(textBody, "Type: article");
      assertStringIncludes(textBody, "ID: 123");
      assertStringIncludes(textBody, "Title: \"Test Article\"");
      
      // Test renderer media types
      assertEquals(jsonRenderer.mediaType, MEDIA_TYPES.JSON);
      assertEquals(halRenderer.mediaType, MEDIA_TYPES.HAL_JSON);
      assertEquals(textRenderer.mediaType, MEDIA_TYPES.TEXT);
      
      // Test canRender method
      assertEquals(jsonRenderer.canRender(resource), true);
      assertEquals(halRenderer.canRender(resource), true);
      assertEquals(textRenderer.canRender(resource), true);
    });
    
    await t.step("testCustomRenderers - Test custom renderers", async () => {
      // Create a custom renderer
      class CustomXmlRenderer implements ResourceRenderer {
        mediaType = MEDIA_TYPES.XML;
        
        canRender(_resource: Resource | Collection): boolean {
          return true;
        }
        
        render(resource: Resource | Collection, options: ResponseOptions = {}): Response {
          const xml = this.resourceToXml(resource);
          return new Response(xml, {
            ...options,
            headers: {
              'Content-Type': MEDIA_TYPES.XML,
              ...options.headers
            }
          });
        }
        
        private resourceToXml(resource: Resource | Collection): string {
          if (resource instanceof Collection) {
            return `<collection type="${resource.getType()}" count="${resource.getCount()}"/>`;
          }
          
          const properties = resource.getProperties();
          let xml = `<resource type="${resource.getType()}" id="${resource.getId()}">\n`;
          
          // Add properties
          xml += "  <properties>\n";
          for (const [key, value] of Object.entries(properties)) {
            xml += `    <${key}>${value}</${key}>\n`;
          }
          xml += "  </properties>\n";
          
          // Add links
          const links = resource.getLinks();
          if (Object.keys(links).length > 0) {
            xml += "  <links>\n";
            for (const [rel, link] of Object.entries(links)) {
              if (Array.isArray(link)) {
                for (const l of link) {
                  xml += `    <link rel="${rel}" href="${l.href}" />\n`;
                }
              } else {
                xml += `    <link rel="${rel}" href="${link.href}" />\n`;
              }
            }
            xml += "  </links>\n";
          }
          
          xml += "</resource>";
          return xml;
        }
      }
      
      // Create renderer registry
      const RendererRegistry = HyperDeno["RendererRegistry"];
      const registry = new RendererRegistry();
      
      // Register custom renderer
      const customRenderer = new CustomXmlRenderer();
      registry.register(customRenderer);
      
      // Create test resource
      const resource = createResource({
        type: "product",
        id: "123",
        properties: { name: "Test Product", price: 99.99 },
        links: { self: "/products/123" }
      });
      
      // Create request with Accept header
      const headers = new Headers();
      headers.set("Accept", "application/xml");
      const request = new Request("http://example.com", { headers });
      
      // Test renderer registry
      const response = registry.render(resource, request);
      assertEquals(response.headers.get("Content-Type"), "application/xml");
      
      // Test response content
      const content = await response.text();
      assertStringIncludes(content, '<resource type="product" id="123">');
      assertStringIncludes(content, '<name>Test Product</name>');
      assertStringIncludes(content, '<price>99.99</price>');
      assertStringIncludes(content, '<link rel="self" href="/products/123" />');
      
      // Test getMediaTypes
      const mediaTypes = registry.getMediaTypes();
      assertArrayIncludes(mediaTypes, ["application/json", "application/hal+json", "text/plain", "application/xml"]);
      
      // Test setDefaultRenderer
      registry.setDefaultRenderer("application/xml");
      
      // Create request with no Accept header
      const plainRequest = new Request("http://example.com");
      
      // Test default renderer
      const defaultResponse = registry.render(resource, plainRequest);
      assertEquals(defaultResponse.headers.get("Content-Type"), "application/xml");
    });
  });
  
  /**
   * Test Event System
   */
  Deno.test("Event System", async (t) => {
    await t.step("testEventEmitter - Test event emitter registration and emission", () => {
      const emitter = new EventEmitter();
      
      // Track event calls
      const events: Record<string, unknown[]> = {
        test: [],
        other: []
      };
      
      // Register event handlers
      const handler1 = (data: unknown) => {
        events.test.push(data);
      };
      
      const handler2 = (data: unknown) => {
        events.test.push({ ...data as object, handled: true });
      };
      
      const otherHandler = (data: unknown) => {
        events.other.push(data);
      };
      
      // Add handlers
      emitter.on("test", handler1);
      emitter.on("test", handler2);
      emitter.on("other", otherHandler);
      
      // Emit events
      emitter.emit("test", { id: 1, message: "Test event" });
      
      // Check handler execution
      assertEquals(events.test.length, 2);
      assertEquals((events.test[0] as Record<string, unknown>).id, 1);
      assertEquals((events.test[1] as Record<string, unknown>).handled, true);
      
      // Emit another event
      emitter.emit("other", { id: 2, message: "Other event" });
      assertEquals(events.other.length, 1);
      assertEquals((events.other[0] as Record<string, unknown>).id, 2);
      
      // Remove handler
      emitter.off("test", handler1);
      
      // Emit again
      emitter.emit("test", { id: 3, message: "After removal" });
      
      // Check that only handler2 was called
      assertEquals(events.test.length, 3); // Only one more event
      assertEquals((events.test[2] as Record<string, unknown>).id, 3);
      assertEquals((events.test[2] as Record<string, unknown>).handled, true);
      
      // Test once handler
      let onceData = null;
      emitter.once("once", (data) => {
        onceData = data;
      });
      
      // First emission should trigger
      emitter.emit("once", { id: "once" });
      assertEquals((onceData as Record<string, unknown>).id, "once");
      
      // Reset and emit again - should not be called
      onceData = null;
      emitter.emit("once", { id: "again" });
      assertEquals(onceData, null);
      
      // Test event names
      const eventNames = emitter.getEventNames();
      assertArrayIncludes(eventNames, ["test", "other"]);
      
      // Test get handlers
      const testHandlers = emitter.getHandlers("test");
      assertEquals(testHandlers.length, 1); // handler1 was removed
      
      // Test remove all listeners for event
      emitter.removeAllListeners("test");
      assertEquals(emitter.getHandlers("test").length, 0);
      
      // Test remove all listeners
      emitter.removeAllListeners();
      assertEquals(emitter.getHandlers("other").length, 0);
      assertEquals(Object.keys(emitter.getEventNames()).length, 0);
    });
    
    await t.step("testFrameworkEvents - Test framework events", () => {
      // Test framework event enum
      assertEquals(FrameworkEvent.SERVER_START, "server:start");
      assertEquals(FrameworkEvent.SERVER_STOP, "server:stop");
      assertEquals(FrameworkEvent.REQUEST_START, "request:start");
      assertEquals(FrameworkEvent.REQUEST_END, "request:end");
      assertEquals(FrameworkEvent.ERROR, "error");
      assertEquals(FrameworkEvent.RESOURCE_CREATED, "resource:created");
      assertEquals(FrameworkEvent.RESOURCE_UPDATED, "resource:updated");
      assertEquals(FrameworkEvent.RESOURCE_DELETED, "resource:deleted");
    });
  });
  
  /**
   * Test Configuration System
   */
  Deno.test("Configuration System", async (t) => {
    await t.step("testConfigurationManagement - Test configuration management", () => {
      // Create configuration manager with initial config
      const ConfigurationManager = HyperDeno["ConfigurationManager"];
      const configManager = new ConfigurationManager({
        port: 3000,
        hostname: "localhost",
        defaultMediaType: MEDIA_TYPES.JSON,
        errorHandling: {
          detailed: true
        }
      });
      
      // Get full config
      const config = configManager.getConfig();
      assertEquals(config.port, 3000);
      assertEquals(config.hostname, "localhost");
      assertEquals(config.defaultMediaType, MEDIA_TYPES.JSON);
      assertEquals(config.errorHandling?.detailed, true);
      
      // Get specific config values
      assertEquals(configManager.get("port"), 3000);
      assertEquals(configManager.get("hostname"), "localhost");
      
      // Update config
      configManager.updateConfig({
        port: 8080,
        defaultMediaType: MEDIA_TYPES.HAL_JSON
      });
      
      // Check updated config
      const updatedConfig = configManager.getConfig();
      assertEquals(updatedConfig.port, 8080); // Updated
      assertEquals(updatedConfig.hostname, "localhost"); // Unchanged
      assertEquals(updatedConfig.defaultMediaType, MEDIA_TYPES.HAL_JSON); // Updated
      assertEquals(updatedConfig.errorHandling?.detailed, true); // Unchanged
      
      // Set specific value
      configManager.set("hostname", "0.0.0.0");
      assertEquals(configManager.get("hostname"), "0.0.0.0");
      
      // Update nested config
      configManager.updateConfig({
        errorHandling: {
          detailed: false,
          handlers: {
            "NOT_FOUND": () => new Response("Not found", { status: 404 })
          }
        }
      });
      
      // Check nested config update
      const nestedConfig = configManager.getConfig();
      assertEquals(nestedConfig.errorHandling?.detailed, false);
      assertExists(nestedConfig.errorHandling?.handlers?.["NOT_FOUND"]);
    });
    
    await t.step("testConfigurationApplication - Test configuration application to server", () => {
      // Create mock server
      const mockServer = {
        registeredRenderers: [] as string[],
        registeredPlugins: [] as string[],
        registeredMiddlewares: [] as string[],
        registeredEventHandlers: {} as Record<string, string[]>,
        
        registerRenderer: function(renderer: { mediaType: string }) {
          this.registeredRenderers.push(renderer.mediaType);
        },
        
        registerPlugin: function(plugin: { name: string }) {
          this.registeredPlugins.push(plugin.name);
        },
        
        use: function(middleware: Function) {
          this.registeredMiddlewares.push("middleware");
        },
        
        getRendererRegistry: function() {
          return {
            register: (renderer: { mediaType: string }) => {
              mockServer.registerRenderer(renderer);
            },
            setDefaultRenderer: (mediaType: string) => {
              mockServer.defaultMediaType = mediaType;
            }
          };
        },
        
        getEventEmitter: function() {
          return {
            on: (event: string, handler: Function) => {
              if (!mockServer.registeredEventHandlers[event]) {
                mockServer.registeredEventHandlers[event] = [];
              }
              mockServer.registeredEventHandlers[event].push("handler");
            }
          };
        },
        
        defaultMediaType: ""
      };
      
      // Create configuration manager
      const ConfigurationManager = HyperDeno["ConfigurationManager"];
      const configManager = new ConfigurationManager({
        renderers: [
          { mediaType: "application/custom+json" },
          { mediaType: "text/custom" }
        ],
        plugins: [
          { name: "plugin1" },
          { name: "plugin2" }
        ],
        middlewares: [
          () => {}, 
          () => {}
        ],
        defaultMediaType: "application/custom+json",
        eventHandlers: {
          "test:event": [() => {}],
          "other:event": [() => {}, () => {}]
        }
      });
      
      // Apply configuration to server
      configManager.applyToServer(mockServer as any);
      
      // Verify renderer registration
      assertEquals(mockServer.registeredRenderers.length, 2);
      assertEquals(mockServer.registeredRenderers[0], "application/custom+json");
      assertEquals(mockServer.registeredRenderers[1], "text/custom");
      
      // Verify default media type
      assertEquals(mockServer.defaultMediaType, "application/custom+json");
      
      // Verify plugin registration
      assertEquals(mockServer.registeredPlugins.length, 2);
      assertEquals(mockServer.registeredPlugins[0], "plugin1");
      assertEquals(mockServer.registeredPlugins[1], "plugin2");
      
      // Verify middleware registration
      assertEquals(mockServer.registeredMiddlewares.length, 2);
      
      // Verify event handler registration
      assertEquals(mockServer.registeredEventHandlers["test:event"].length, 1);
      assertEquals(mockServer.registeredEventHandlers["other:event"].length, 2);
    });
  });
  
  /**
   * Test Server
   */
  Deno.test("Server", async (t) => {
    await t.step("testServerCreation - Test server creation and initialization", () => {
      const Server = HyperDeno["Server"];
      
      // Create server
      const server = new Server({
        port: 3000,
        hostname: "localhost"
      });
      
      // Access server components
      const router = server.getRouter();
      const pluginManager = server.getPluginManager();
      const rendererRegistry = server.getRendererRegistry();
      const eventEmitter = server.getEventEmitter();
      const configManager = server.getConfigManager();
      
      // Verify components exist
      assertExists(router);
      assertExists(pluginManager);
      assertExists(rendererRegistry);
      assertExists(eventEmitter);
      assertExists(configManager);
      
      // Register plugin
      const plugin = {
        name: "test-plugin",
        initialize: () => {}
      };
      server.registerPlugin(plugin);
      
      // Register renderer
      class TestRenderer {
        mediaType = "test/media-type";
        canRender() { return true; }
        render() { return new Response("test"); }
      }
      server.registerRenderer(new TestRenderer());
      
      // Register event handler
      let eventCalled = false;
      server.on("test:event", () => {
        eventCalled = true;
      });
      
      // Register middleware
      server.use(async (req: any, ctx: any, next: any) => {
        return await next();
      });
      
      // Emit event to test handler
      eventEmitter.emit("test:event", {});
      assertEquals(eventCalled, true);
      
      // Update configuration
      server.configure({
        port: 8080,
        defaultMediaType: "application/hal+json"
      });
      
      // Verify configuration update
      assertEquals(configManager.get("port"), 8080);
    });
    
    await t.step("testServerRequestFlow - Test server request processing flow", async () => {
      const Server = HyperDeno["Server"];
      
      // Create server
      const server = new Server({
        port: 3000,
        hostname: "localhost"
      });
      
      // Get router
      const router = server.getRouter();
      
      // Track request flow
      const flowEvents: string[] = [];
      
      // Register middleware to track flow
      server.use(async (req: Request, ctx: any, next: any) => {
        flowEvents.push("middleware:before");
        const response = await next();
        flowEvents.push("middleware:after");
        return response;
      });
      
      // Register route
      router.get("/test", () => {
        flowEvents.push("route:handler");
        return new Response("Test Response");
      });
      
      // Register event handlers
      server.on(FrameworkEvent.REQUEST_START, () => {
        flowEvents.push("event:request:start");
      });
      
      server.on(FrameworkEvent.REQUEST_END, () => {
        flowEvents.push("event:request:end");
      });
      
      // Create test request
      const request = new Request("http://localhost:3000/test");
      
      // Process request directly through router
      // Note: We can't test the server.start() method directly in a unit test
      const eventEmitter = server.getEventEmitter();
      eventEmitter.emit(FrameworkEvent.REQUEST_START, { request });
      
      await router.handle(request);
      
      eventEmitter.emit(FrameworkEvent.REQUEST_END, { request, response: new Response() });
      
      // Verify request flow
      assertArrayIncludes(flowEvents, ["event:request:start", "middleware:before", "route:handler", "middleware:after", "event:request:end"]);
    });
  });
  
  /**
   * Test Factory Functions
   */
  Deno.test("Factory Functions", async (t) => {
    await t.step("testFactoryFunctions - Test convenience factory functions", () => {
      // Test createResource
      const resource = createResource({
        type: "article",
        id: "123",
        properties: {
          title: "Test Article",
          published: true
        },
        links: {
          self: "/articles/123",
          edit: "/articles/123/edit"
        },
        state: "published"
      });
      
      // Verify resource
      assertEquals(resource.getType(), "article");
      assertEquals(resource.getId(), "123");
      assertEquals(resource.getProperty("title"), "Test Article");
      assertEquals(resource.getProperty("published"), true);
      assertExists(resource.getLink("self"));
      assertExists(resource.getLink("edit"));
      assertEquals(resource.getState(), "published");
      
      // Test createCollection
      const collection = createCollection({
        type: "articles",
        items: [
          createResource({ type: "article", id: "1" }),
          createResource({ type: "article", id: "2" })
        ],
        links: {
          self: "/articles",
          create: "/articles/create"
        },
        pagination: {
          page: 1,
          pageSize: 10,
          total: 42
        },
        collectionName: "articles"
      });
      
      // Verify collection
      assertEquals(collection.getType(), "articles");
      assertEquals(collection.getCount(), 2);
      assertExists(collection.getLink("self"));
      assertExists(collection.getLink("create"));
      const pagination = collection.getPagination();
      assertExists(pagination);
      assertEquals(pagination.page, 1);
      assertEquals(pagination.total, 42);
      assertEquals(collection.getCollectionName(), "articles");
      
      // Test createResponse
      const jsonResponse = createJsonResponse({
        message: "Hello, World!",
        status: "success"
      }, { status: 200 });
      
      assertEquals(jsonResponse.headers.get("Content-Type"), "application/json");
      assertEquals(jsonResponse.status, 200);
      
      // Test createApp
      const app = createApp({
        port: 3000,
        hostname: "localhost"
      });
      
      assertExists(app.router);
      assertExists(app.server);
      assertExists(app.start);
      assertExists(app.stop);
      assertExists(app.defineResource);
      assertExists(app.registerResources);
      assertExists(app.use);
      assertExists(app.registerPlugin);
      assertExists(app.registerRenderer);
      assertExists(app.on);
      assertExists(app.configure);
    });
  });

  /**
   * Test Internationalization & Localization
   */
  Deno.test("Internationalization & Localization", async (t) => {
    await t.step("testMultiLanguageResources - Test resources with multi-language content", () => {
      // Create a resource with multi-language properties
      const article = new Resource({
        type: "article",
        id: "article-123",
        properties: {
          translations: {
            en: {
              title: "Hello World",
              content: "This is an article about HyperDeno."
            },
            es: {
              title: "Hola Mundo",
              content: "Este es un artículo sobre HyperDeno."
            },
            fr: {
              title: "Bonjour le Monde",
              content: "C'est un article sur HyperDeno."
            }
          },
          // Default language
          defaultLanguage: "en"
        }
      });
  
      // Check that translations exist
      const props = article.getProperties();
      assertExists(props.translations);
      assertExists((props.translations as Record<string, unknown>).en);
      assertExists((props.translations as Record<string, unknown>).es);
      assertExists((props.translations as Record<string, unknown>).fr);
    });
  
    await t.step("testLanguageSpecificLinks - Test language-specific links", () => {
      // Create a resource with language-specific links
      const product = new Resource({
        type: "product",
        id: "prod-456"
      });
  
      // Add language-specific links
      product.addLink("documentation:en", "/docs/en/products/456", "GET", { hreflang: "en" });
      product.addLink("documentation:es", "/docs/es/products/456", "GET", { hreflang: "es" });
      product.addLink("documentation:fr", "/docs/fr/products/456", "GET", { hreflang: "fr" });
  
      // Check links
      const enLink = product.getLink("documentation:en");
      const esLink = product.getLink("documentation:es");
      const frLink = product.getLink("documentation:fr");
  
      assertExists(enLink);
      assertExists(esLink);
      assertExists(frLink);
  
      if (!Array.isArray(enLink)) {
        assertEquals(enLink.hreflang, "en");
      }
      if (!Array.isArray(esLink)) {
        assertEquals(esLink.hreflang, "es");
      }
      if (!Array.isArray(frLink)) {
        assertEquals(frLink.hreflang, "fr");
      }
    });
  
    await t.step("testAcceptLanguageNegotiation - Test Accept-Language middleware", async () => {
      const middleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Get Accept-Language header
        const acceptLanguage = request.headers.get("Accept-Language") || "en";
        
        // Parse language preference (simplified)
        const languages = acceptLanguage.split(',').map(lang => lang.trim().split(';')[0]);
        const preferredLanguage = languages[0].substring(0, 2); // Just take first two chars
        
        // Store in context
        context.state.language = preferredLanguage;
        
        // Continue processing
        return await next();
      };
  
      // Create a middleware chain with our language middleware
      const chain = new MiddlewareChain();
      chain.use(middleware);
  
      // Create test requests with different Accept-Language headers
      const enRequest = new Request("https://example.com", {
        headers: { "Accept-Language": "en-US,en;q=0.9" }
      });
      const frRequest = new Request("https://example.com", {
        headers: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" }
      });
      const deRequest = new Request("https://example.com", {
        headers: { "Accept-Language": "de;q=0.9,en;q=0.8" }
      });
  
      // Mock final handler
      const finalHandler = async () => new Response("OK");
  
      // Test English request
      let context = { params: {}, state: {} };
      await chain.execute(enRequest, context, finalHandler);
      assertEquals(context.state.language, "en");
  
      // Test French request
      context = { params: {}, state: {} };
      await chain.execute(frRequest, context, finalHandler);
      assertEquals(context.state.language, "fr");
  
      // Test German request
      context = { params: {}, state: {} };
      await chain.execute(deRequest, context, finalHandler);
      assertEquals(context.state.language, "de");
    });
  });
  
  /**
   * Test Rate Limiting & Throttling
   */
  Deno.test("Rate Limiting & Throttling", async (t) => {
    await t.step("testRateLimitMiddleware - Test basic rate limiting middleware", async () => {
      // Simple in-memory rate limiter
      const rateLimits = new Map<string, { count: number, resetAt: number }>();
      
      const rateLimitMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Use client IP as key (would use something more reliable in production)
        const clientIP = "127.0.0.1"; // Simplified for test
        const now = Date.now();
        const limit = 5; // 5 requests
        const windowMs = 60000; // 1 minute window
        
        // Get or initialize rate limit data
        let rateData = rateLimits.get(clientIP);
        if (!rateData || rateData.resetAt < now) {
          rateData = { count: 0, resetAt: now + windowMs };
          rateLimits.set(clientIP, rateData);
        }
        
        // Increment count
        rateData.count++;
        
        // Check if rate limit is exceeded
        if (rateData.count > limit) {
          const retryAfter = Math.ceil((rateData.resetAt - now) / 1000);
          // Return rate limit exceeded response
          return new Response("Rate limit exceeded", {
            status: 429,
            headers: {
              "Retry-After": retryAfter.toString(),
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.floor(rateData.resetAt / 1000).toString()
            }
          });
        }
        
        // Add rate limit headers
        const response = await next();
        const remaining = limit - rateData.count;
        
        // Clone response to add headers
        const headers = new Headers(response.headers);
        headers.set("X-RateLimit-Limit", limit.toString());
        headers.set("X-RateLimit-Remaining", remaining.toString());
        headers.set("X-RateLimit-Reset", Math.floor(rateData.resetAt / 1000).toString());
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(rateLimitMiddleware);
      
      // Final handler
      const finalHandler = async () => new Response("OK");
      
      // Execute requests under the limit
      const request = new Request("https://example.com");
      let context = { params: {}, state: {} };
      let response;
      
      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        response = await chain.execute(request, context, finalHandler);
        assertEquals(response.status, 200);
        
        // Check headers
        const remaining = parseInt(response.headers.get("X-RateLimit-Remaining") || "0");
        assertEquals(remaining, 5 - (i + 1));
      }
      
      // 6th request should be rate limited
      response = await chain.execute(request, context, finalHandler);
      assertEquals(response.status, 429);
      assertExists(response.headers.get("Retry-After"));
    });
  
    await t.step("testThrottlingBehavior - Test throttling with timing", async () => {
      // Throttle by adding delay
      const throttleMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Simple throttling - add artificial delay
        const path = new URL(request.url).pathname;
        
        // Only throttle specific paths
        if (path.startsWith("/api/heavy")) {
          // Record throttle start time
          const startTime = Date.now();
          context.state.throttleStart = startTime;
  
          // Add artificial delay (100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
  
          // Continue processing
          const response = await next();
  
          // Calculate actual delay
          const endTime = Date.now();
          const delay = endTime - startTime;
          
          // Clone response to add headers
          const headers = new Headers(response.headers);
          headers.set("X-Throttle-Time-Ms", delay.toString());
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
          });
        }
        
        // Normal processing for non-throttled paths
        return await next();
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(throttleMiddleware);
      
      // Final handler
      const finalHandler = async () => new Response("OK");
      
      // Execute throttled request
      const throttledRequest = new Request("https://example.com/api/heavy/operation");
      let context = { params: {}, state: {} };
      const startTime = Date.now();
      const response = await chain.execute(throttledRequest, context, finalHandler);
      const endTime = Date.now();
  
      // Check that request was actually delayed
      const delay = endTime - startTime;
      const headerDelay = parseInt(response.headers.get("X-Throttle-Time-Ms") || "0");
      
      assertEquals(response.status, 200);
      assertExists(context.state.throttleStart);
      // Delay should be at least 100ms
      assertEquals(delay >= 100, true);
      assertEquals(headerDelay >= 100, true);
      
      // Execute non-throttled request
      const regularRequest = new Request("https://example.com/api/fast/operation");
      context = { params: {}, state: {} };
      const regularStartTime = Date.now();
      await chain.execute(regularRequest, context, finalHandler);
      const regularEndTime = Date.now();
      
      // Regular request should not have artificial delay
      const regularDelay = regularEndTime - regularStartTime;
      assertEquals(context.state.throttleStart, undefined);
      // Regular delay should be much less than 100ms, but allowing some test variance
      assertEquals(regularDelay < 50, true);
    });
  });
  
  /**
   * Test Conditional Requests
   */
  Deno.test("Conditional Requests", async (t) => {
    await t.step("testETagHandling - Test ETag generation and handling", async () => {
      // ETag middleware
      const etagMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Only handle GET requests
        if (request.method !== "GET") {
          return await next();
        }
        
        // Process the request
        const response = await next();
        
        // Only generate ETags for 200 responses
        if (response.status !== 200) {
          return response;
        }
        
        // Generate ETag from response body
        const body = await response.clone().text();
        const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(body));
        const etag = `"${Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')}"`;
        
        // Check If-None-Match header
        const ifNoneMatch = request.headers.get("If-None-Match");
        if (ifNoneMatch === etag) {
          // Return 304 Not Modified
          return new Response(null, {
            status: 304,
            headers: {
              "ETag": etag,
              "Cache-Control": "max-age=3600"
            }
          });
        }
        
        // Return response with ETag
        const headers = new Headers(response.headers);
        headers.set("ETag", etag);
        headers.set("Cache-Control", "max-age=3600");
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(etagMiddleware);
      
      // Create a final handler that returns a predictable response
      const finalHandler = async () => new Response("test content", {
        headers: { "Content-Type": "text/plain" }
      });
      
      // Make an initial request to get ETag
      const initialRequest = new Request("https://example.com/resource");
      let context = { params: {}, state: {} };
      const initialResponse = await chain.execute(initialRequest, context, finalHandler);
      
      // Get ETag from response
      const etag = initialResponse.headers.get("ETag");
      assertExists(etag);
      assertEquals(initialResponse.status, 200);
      assertEquals(await initialResponse.text(), "test content");
      
      // Make a conditional request with matching ETag
      const conditionalRequest = new Request("https://example.com/resource", {
        headers: { "If-None-Match": etag }
      });
      context = { params: {}, state: {} };
      const conditionalResponse = await chain.execute(conditionalRequest, context, finalHandler);
      
      // Should return 304 Not Modified
      assertEquals(conditionalResponse.status, 304);
      assertEquals(conditionalResponse.headers.get("ETag"), etag);
      
      // Make a request with non-matching ETag
      const nonMatchingRequest = new Request("https://example.com/resource", {
        headers: { "If-None-Match": '"nonmatching"' }
      });
      context = { params: {}, state: {} };
      const nonMatchingResponse = await chain.execute(nonMatchingRequest, context, finalHandler);
      
      // Should return 200 OK with full content
      assertEquals(nonMatchingResponse.status, 200);
      assertEquals(await nonMatchingResponse.text(), "test content");
    });
  
    await t.step("testIfModifiedSince - Test If-Modified-Since handling", async () => {
      // Last-Modified middleware
      const lastModifiedMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Only handle GET requests
        if (request.method !== "GET") {
          return await next();
        }
        
        // For this test, we'll use a fixed last modified date
        const lastModified = new Date("2023-01-01T12:00:00Z");
        const lastModifiedStr = lastModified.toUTCString();
        
        // Check If-Modified-Since header
        const ifModifiedSince = request.headers.get("If-Modified-Since");
        if (ifModifiedSince) {
          const ifModifiedSinceDate = new Date(ifModifiedSince);
          
          // If resource hasn't been modified, return 304
          if (lastModified <= ifModifiedSinceDate) {
            return new Response(null, {
              status: 304,
              headers: {
                "Last-Modified": lastModifiedStr,
                "Cache-Control": "max-age=3600"
              }
            });
          }
        }
        
        // Process the request
        const response = await next();
        
        // Add Last-Modified header
        const headers = new Headers(response.headers);
        headers.set("Last-Modified", lastModifiedStr);
        headers.set("Cache-Control", "max-age=3600");
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(lastModifiedMiddleware);
      
      // Final handler
      const finalHandler = async () => new Response("test content");
      
      // Make an initial request to get Last-Modified
      const initialRequest = new Request("https://example.com/resource");
      let context = { params: {}, state: {} };
      const initialResponse = await chain.execute(initialRequest, context, finalHandler);
      
      // Check Last-Modified header
      const lastModified = initialResponse.headers.get("Last-Modified");
      assertExists(lastModified);
      assertEquals(initialResponse.status, 200);
      
      // Make a request with matching If-Modified-Since
      const notModifiedRequest = new Request("https://example.com/resource", {
        headers: { "If-Modified-Since": lastModified }
      });
      context = { params: {}, state: {} };
      const notModifiedResponse = await chain.execute(notModifiedRequest, context, finalHandler);
      
      // Should return 304 Not Modified
      assertEquals(notModifiedResponse.status, 304);
      
      // Make a request with older If-Modified-Since
      const olderRequest = new Request("https://example.com/resource", {
        headers: { "If-Modified-Since": "Wed, 01 Jan 2020 00:00:00 GMT" }
      });
      context = { params: {}, state: {} };
      const modifiedResponse = await chain.execute(olderRequest, context, finalHandler);
      
      // Should return 200 OK with content
      assertEquals(modifiedResponse.status, 200);
      assertEquals(await modifiedResponse.text(), "test content");
    });
  });
  
  /**
   * Test CORS Edge Cases
   */
  Deno.test("CORS Edge Cases", async (t) => {
    await t.step("testComplexCORSRequests - Test complex CORS scenarios", async () => {
      // Advanced CORS middleware
      const corsMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        const origin = request.headers.get("Origin");
        
        // If no origin, it's not a CORS request
        if (!origin) {
          return await next();
        }
        
        // Define allowed origins (could be dynamic based on environment)
        const allowedOrigins = ["https://trusted-app.com", "https://admin.trusted-app.com"];
        
        // Check if origin is allowed
        const isAllowedOrigin = allowedOrigins.includes(origin);
        const corsHeaders = new Headers();
        
        // Only allow specific origins rather than '*'
        if (isAllowedOrigin) {
          corsHeaders.set("Access-Control-Allow-Origin", origin);
        } else {
          // Don't proceed with disallowed origins
          return new Response("CORS not allowed", { status: 403 });
        }
        
        // Allow credentials
        corsHeaders.set("Access-Control-Allow-Credentials", "true");
        
        // Handle preflight requests
        if (request.method === "OPTIONS") {
          // Get requested method and headers
          const requestMethod = request.headers.get("Access-Control-Request-Method");
          const requestHeaders = request.headers.get("Access-Control-Request-Headers");
          
          // Handle complex request requirements
          corsHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
          
          // Only allow specific headers if requested
          if (requestHeaders) {
            corsHeaders.set("Access-Control-Allow-Headers", 
              "Content-Type, Authorization, X-Requested-With, X-Custom-Header");
          }
          
          // Set max age for preflight results
          corsHeaders.set("Access-Control-Max-Age", "86400"); // 24 hours
          
          // Return preflight response
          return new Response(null, {
            status: 204,
            headers: corsHeaders
          });
        }
        
        // For actual requests, process normally
        const response = await next();
        
        // Add CORS headers to the response
        const headers = new Headers(response.headers);
        
        // Copy CORS headers to response
        corsHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
        
        // Add expose headers
        headers.set("Access-Control-Expose-Headers", "Content-Length, X-Request-Id, X-RateLimit-Limit");
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(corsMiddleware);
      
      // Final handler
      const finalHandler = async () => new Response("OK");
      
      // Test preflight request from allowed origin
      const preflightRequest = new Request("https://example.com/api/data", {
        method: "OPTIONS",
        headers: {
          "Origin": "https://trusted-app.com",
          "Access-Control-Request-Method": "PUT",
          "Access-Control-Request-Headers": "Content-Type, Authorization, X-Custom-Header"
        }
      });
      
      let context = { params: {}, state: {} };
      const preflightResponse = await chain.execute(preflightRequest, context, finalHandler);
      
      // Check preflight response
      assertEquals(preflightResponse.status, 204);
      assertEquals(
        preflightResponse.headers.get("Access-Control-Allow-Origin"), 
        "https://trusted-app.com"
      );
      assertEquals(preflightResponse.headers.get("Access-Control-Allow-Credentials"), "true");
      assertExists(preflightResponse.headers.get("Access-Control-Allow-Methods"));
      assertExists(preflightResponse.headers.get("Access-Control-Allow-Headers"));
      assertExists(preflightResponse.headers.get("Access-Control-Max-Age"));
      
      // Test actual request from allowed origin
      const actualRequest = new Request("https://example.com/api/data", {
        method: "PUT",
        headers: {
          "Origin": "https://trusted-app.com",
          "Content-Type": "application/json"
        }
      });
      
      context = { params: {}, state: {} };
      const actualResponse = await chain.execute(actualRequest, context, finalHandler);
      
      // Check actual response
      assertEquals(actualResponse.status, 200);
      assertEquals(
        actualResponse.headers.get("Access-Control-Allow-Origin"), 
        "https://trusted-app.com"
      );
      assertEquals(actualResponse.headers.get("Access-Control-Allow-Credentials"), "true");
      assertEquals(
        actualResponse.headers.get("Access-Control-Expose-Headers"),
        "Content-Length, X-Request-Id, X-RateLimit-Limit"
      );
      
      // Test request from disallowed origin
      const disallowedRequest = new Request("https://example.com/api/data", {
        headers: { "Origin": "https://malicious-app.com" }
      });
      
      context = { params: {}, state: {} };
      const disallowedResponse = await chain.execute(disallowedRequest, context, finalHandler);
      
      // Check that disallowed origin is rejected
      assertEquals(disallowedResponse.status, 403);
    });
  });
  
  /**
   * Test Partial Response/Update
   */
  Deno.test("Partial Response and Updates", async (t) => {
    await t.step("testFieldSelection - Test field selection via query parameters", async () => {
      // Field selection middleware
      const fieldSelectionMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Process the request
        const response = await next();
        
        // Only process JSON responses
        if (response.headers.get("Content-Type")?.includes("application/json")) {
          // Check for fields parameter
          const url = new URL(request.url);
          const fields = url.searchParams.get("fields");
          
          if (fields && fields.trim() !== "") {
            // Get selected fields
            const selectedFields = fields.split(",").map(f => f.trim());
            
            // Parse response body
            const body = await response.json();
            
            // If it's a Resource or Collection format
            if (body.properties && typeof body.properties === "object") {
              // Filter properties
              const filteredProperties: Record<string, unknown> = {};
              
              for (const field of selectedFields) {
                if (field in body.properties) {
                  filteredProperties[field] = body.properties[field];
                }
              }
              
              // Replace properties with filtered ones
              body.properties = filteredProperties;
              
              // Return filtered response
              return new Response(JSON.stringify(body), {
                status: response.status,
                headers: response.headers
              });
            }
            
            // If it's a regular JSON object
            else if (typeof body === "object" && body !== null) {
              // Filter fields
              const filtered: Record<string, unknown> = {};
              
              for (const field of selectedFields) {
                if (field in body) {
                  filtered[field] = body[field];
                }
              }
              
              // Return filtered response
              return new Response(JSON.stringify(filtered), {
                status: response.status,
                headers: response.headers
              });
            }
          }
        }
        
        // Return original response if no filtering needed
        return response;
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(fieldSelectionMiddleware);
      
      // Create a final handler that returns a resource
      const finalHandler = async () => {
        const resource = createResource({
          type: "user",
          id: "123",
          properties: {
            name: "John Doe",
            email: "john@example.com",
            age: 30,
            address: {
              street: "123 Main St",
              city: "Anytown",
              zip: "12345"
            },
            roles: ["admin", "user"]
          }
        });
        
        return createResponse(resource);
      };
      
      // Test normal request (no field selection)
      const normalRequest = new Request("https://example.com/users/123");
      let context = { params: {}, state: {} };
      const normalResponse = await chain.execute(normalRequest, context, finalHandler);
      
      // Check full response
      const normalBody = await normalResponse.json();
      assertEquals(normalBody.properties.name, "John Doe");
      assertEquals(normalBody.properties.email, "john@example.com");
      assertEquals(normalBody.properties.age, 30);
      assertExists(normalBody.properties.address);
      assertExists(normalBody.properties.roles);
      
      // Test request with field selection
      const filteredRequest = new Request("https://example.com/users/123?fields=name,email");
      context = { params: {}, state: {} };
      const filteredResponse = await chain.execute(filteredRequest, context, finalHandler);
      
      // Check filtered response
      const filteredBody = await filteredResponse.json();
      assertEquals(filteredBody.properties.name, "John Doe");
      assertEquals(filteredBody.properties.email, "john@example.com");
      assertEquals(filteredBody.properties.age, undefined);
      assertEquals(filteredBody.properties.address, undefined);
      assertEquals(filteredBody.properties.roles, undefined);
    });
  
    await t.step("testPatchOperation - Test PATCH operations with JSON Patch", async () => {
      // Simple JSON Patch implementation for testing
      function applyJsonPatch(doc: any, patches: any[]): any {
        const result = JSON.parse(JSON.stringify(doc)); // Deep clone
        
        for (const patch of patches) {
          const { op, path, value } = patch;
          const pathParts = path.split('/').filter(Boolean);
          
          if (op === "add" || op === "replace") {
            let current = result;
            const lastPart = pathParts.pop();
            
            // Navigate to the parent
            for (const part of pathParts) {
              if (!(part in current)) {
                current[part] = {};
              }
              current = current[part];
            }
            
            // Set the value
            current[lastPart!] = value;
          }
          else if (op === "remove") {
            let current = result;
            const lastPart = pathParts.pop();
            
            // Navigate to the parent
            for (const part of pathParts) {
              if (!(part in current)) {
                break;
              }
              current = current[part];
            }
            
            // Remove the property
            if (current && lastPart! in current) {
              delete current[lastPart!];
            }
          }
        }
        
        return result;
      }
  
      // Create a resource
      const resource = createResource({
        type: "user",
        id: "123",
        properties: {
          name: "John Doe",
          email: "john@example.com",
          roles: ["user"],
          preferences: {
            language: "en",
            theme: "light"
          }
        }
      });
  
      // Create patches
      const patches = [
        { op: "replace", path: "/name", value: "Jane Doe" },
        { op: "add", path: "/age", value: 30 },
        { op: "remove", path: "/preferences/theme" },
        { op: "add", path: "/roles/1", value: "admin" }
      ];
  
      // Apply patches
      const patchedProps = applyJsonPatch(resource.getProperties(), patches);
      
      // Create patched resource
      const patchedResource = createResource({
        type: "user",
        id: "123",
        properties: patchedProps
      });
  
      // Check patched resource
      assertEquals(patchedResource.getProperty("name"), "Jane Doe");
      assertEquals(patchedResource.getProperty("age"), 30);
      assertEquals(patchedResource.getProperty("email"), "john@example.com");
      assertEquals((patchedResource.getProperty("preferences") as Record<string, string>).language, "en");
      assertEquals((patchedResource.getProperty("preferences") as Record<string, string>).theme, undefined);
      assertArrayIncludes(patchedResource.getProperty("roles") as string[], ["user", "admin"]);
      
      // Simulate PATCH handler middleware
      const patchMiddleware = async (request: Request, context: any, next: () => Promise<Response>) => {
        // Only handle PATCH requests
        if (request.method === "PATCH") {
          try {
            // Get target resource
            const resourceId = "123"; // Would come from path in real app
            
            // Get patches from request body
            const patches = await request.json();
            
            // Validate patches
            if (!Array.isArray(patches)) {
              return new Response("Invalid JSON Patch format", { status: 400 });
            }
            
            // Get current resource (would fetch from database in real app)
            const currentResource = createResource({
              type: "user",
              id: resourceId,
              properties: {
                name: "John Doe",
                email: "john@example.com",
                roles: ["user"],
                preferences: {
                  language: "en",
                  theme: "light"
                }
              }
            });
            
            // Apply patches
            const patchedProps = applyJsonPatch(currentResource.getProperties(), patches);
            
            // Update resource (would save to database in real app)
            const updatedResource = createResource({
              type: currentResource.getType(),
              id: currentResource.getId(),
              properties: patchedProps
            });
            
            // Copy links
            Object.entries(currentResource.getLinks()).forEach(([rel, link]) => {
              if (Array.isArray(link)) {
                link.forEach(l => updatedResource.addLink(rel, l.href, l.method || "GET"));
              } else {
                updatedResource.addLink(rel, link.href, link.method || "GET");
              }
            });
            
            // Return updated resource
            return createResponse(updatedResource);
          } catch (error) {
            return new Response(`Error processing PATCH: ${error.message}`, { status: 400 });
          }
        }
        
        // Process other requests normally
        return await next();
      };
  
      // Create middleware chain
      const chain = new MiddlewareChain();
      chain.use(patchMiddleware);
      
      // Final handler (shouldn't be called for PATCH)
      const finalHandler = async () => new Response("OK");
      
      // Create PATCH request
      const patchRequest = new Request("https://example.com/users/123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patches)
      });
      
      const context = { params: {}, state: {} };
      const patchResponse = await chain.execute(patchRequest, context, finalHandler);
      
      // Check response
      assertEquals(patchResponse.status, 200);
      
      const updatedResource = await patchResponse.json();
      assertEquals(updatedResource.properties.name, "Jane Doe");
      assertEquals(updatedResource.properties.age, 30);
      assertEquals(updatedResource.properties.email, "john@example.com");
      assertEquals(updatedResource.properties.preferences.language, "en");
      assertEquals(updatedResource.properties.preferences.theme, undefined);
      assertArrayIncludes(updatedResource.properties.roles, ["user", "admin"]);
    });
  });
  
  /**
   * Test Advanced Validation
   */
  Deno.test("Advanced Validation", async (t) => {
    await t.step("testComplexSchemaValidation - Test complex schema validation", () => {
      // Create a complex schema for an order
      const orderSchema = {
        customer: {
          type: "object",
          required: true,
          validate: (value: any) => {
            return value && 
                   typeof value === "object" && 
                   typeof value.id === "string" && 
                   typeof value.email === "string";
          }
        },
        items: {
          type: "array",
          required: true,
          validate: (value: any) => {
            if (!Array.isArray(value) || value.length === 0) {
              return "Order must contain at least one item";
            }
            
            // Validate each item
            for (const item of value) {
              if (!item.productId || !item.quantity || !item.price) {
                return "Each item must have productId, quantity, and price";
              }
              
              if (typeof item.quantity !== "number" || item.quantity <= 0) {
                return "Item quantity must be a positive number";
              }
              
              if (typeof item.price !== "number" || item.price <= 0) {
                return "Item price must be a positive number";
              }
            }
            
            return true;
          }
        },
        shippingAddress: {
          type: "object",
          required: true,
          validate: (value: any) => {
            return value && 
                   typeof value === "object" && 
                   typeof value.street === "string" && 
                   typeof value.city === "string" && 
                   typeof value.zip === "string";
          }
        },
        paymentMethod: {
          type: "string",
          required: true,
          validate: (value: any) => {
            return ["credit-card", "paypal", "bank-transfer"].includes(value);
          }
        },
        total: {
          type: "number",
          required: true,
          validate: (value: any) => {
            if (typeof value !== "number" || value <= 0) {
              return "Total must be a positive number";
            }
            return true;
          }
        }
      };
      
      // Function to validate order
      function validateOrder(data: any): any {
        const errors: Record<string, string> = {};
        let hasErrors = false;
        
        // Check each field against schema
        for (const [field, rule] of Object.entries(orderSchema)) {
          const value = data[field];
          
          // Required field check
          if (rule.required && (value === undefined || value === null)) {
            errors[field] = `${field} is required`;
            hasErrors = true;
            continue;
          }
          
          // Skip validation if field is not required and not provided
          if ((value === undefined || value === null) && !rule.required) {
            continue;
          }
          
          // Type validation
          if (rule.type === "object" && (typeof value !== "object" || value === null)) {
            errors[field] = `${field} must be an object`;
            hasErrors = true;
            continue;
          }
          
          if (rule.type === "array" && !Array.isArray(value)) {
            errors[field] = `${field} must be an array`;
            hasErrors = true;
            continue;
          }
          
          if (rule.type === "string" && typeof value !== "string") {
            errors[field] = `${field} must be a string`;
            hasErrors = true;
            continue;
          }
          
          if (rule.type === "number" && typeof value !== "number") {
            errors[field] = `${field} must be a number`;
            hasErrors = true;
            continue;
          }
          
          // Custom validation
          if (rule.validate) {
            const result = rule.validate(value);
            if (result !== true) {
              errors[field] = typeof result === "string" ? result : `${field} is invalid`;
              hasErrors = true;
            }
          }
        }
        
        // Check if there are any errors
        if (hasErrors) {
          throw new ValidationError("Validation failed", "VALIDATION_ERROR", { errors });
        }
        
        return data;
      }
      
      // Test valid order
      const validOrder = {
        customer: {
          id: "cust-123",
          email: "john@example.com",
          name: "John Doe"
        },
        items: [
          {
            productId: "prod-1",
            quantity: 2,
            price: 9.99,
            subtotal: 19.98
          },
          {
            productId: "prod-2",
            quantity: 1,
            price: 29.99,
            subtotal: 29.99
          }
        ],
        shippingAddress: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zip: "12345"
        },
        paymentMethod: "credit-card",
        total: 49.97
      };
      
      // Test validation of valid order
      const validatedOrder = validateOrder(validOrder);
      assertEquals(validatedOrder, validOrder);
      
      // Test missing required field
      const missingRequiredField = { ...validOrder };
      delete missingRequiredField.customer;
      
      assertThrows(
        () => validateOrder(missingRequiredField),
        ValidationError,
        "Validation failed"
      );
      
      // Test invalid item
      const invalidItems = {
        ...validOrder,
        items: [
          {
            productId: "prod-1",
            quantity: 0, // Invalid quantity
            price: 9.99
          }
        ]
      };
      
      assertThrows(
        () => validateOrder(invalidItems),
        ValidationError,
        "Validation failed"
      );
      
      // Test invalid payment method
      const invalidPayment = {
        ...validOrder,
        paymentMethod: "bitcoin" // Not in allowed list
      };
      
      assertThrows(
        () => validateOrder(invalidPayment),
        ValidationError,
        "Validation failed"
      );
    });
  });


  /*
API Versioning Strategies

Content negotiation based versioning
URL path versioning
Header-based versioning


Error Response Consistency

Test error format consistency across different error types
Test error context capture and serialization
Test error logging and monitoring hooks


Sparse Fieldsets & Projections

Testing the ability to request only specific fields from resources
Testing deep object projection patterns


Performance Tests

Resource serialization benchmarks
Route matching performance
Content negotiation overhead


Security Testing

Testing against common API security vulnerabilities
CSRF protection
Input sanitization


Embedded Resources with Circular References

How the framework handles circular references in embedded resources
Max depth configuration for embedded resources


Long-running Operations & Async APIs

Testing status monitoring endpoints for long-running operations
Webhook callback registration and processing

  */