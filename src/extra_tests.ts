/**
 * HyperDeno Advanced Test Suite
 * 
 * This test file extends the primary test suite with additional tests for more advanced
 * or edge-case functionality in the HyperDeno framework.
 * 
 * These tests help ensure the framework handles real-world scenarios appropriately
 * and covers features that might be used in more complex API implementations.
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