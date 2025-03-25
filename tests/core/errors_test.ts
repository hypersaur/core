/**
 * 🧪 Tests for Error System
 * 
 * Tests the core error types and error response creation in the HATEOAS framework.
 */

import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import {
  ApiError,
  NotFoundError,
  ValidationError,
  AuthError,
  ServerError,
  createErrorResponse,
  Errors
} from "../../hyperdeno/core/errors.ts";

Deno.test("ApiError - Base error class", () => {
  const error = new ApiError("Test error", 400, "TEST_ERROR", { field: "value" });
  
  assertEquals(error.message, "Test error");
  assertEquals(error.status, 400);
  assertEquals(error.code, "TEST_ERROR");
  assertEquals(error.details, { field: "value" });
  
  const json = error.toJSON();
  assertEquals(json.error.message, "Test error");
  assertEquals(json.error.status, 400);
  assertEquals(json.error.code, "TEST_ERROR");
  assertEquals(json.error.details, { field: "value" });
});

Deno.test("NotFoundError - Resource not found", () => {
  const error = new NotFoundError("User not found", "USER_NOT_FOUND", { id: "123" });
  
  assertEquals(error.message, "User not found");
  assertEquals(error.status, 404);
  assertEquals(error.code, "USER_NOT_FOUND");
  assertEquals(error.details, { id: "123" });
});

Deno.test("ValidationError - Input validation", () => {
  const error = new ValidationError("Invalid input", "INVALID_INPUT", {
    errors: ["name is required", "email is invalid"]
  });
  
  assertEquals(error.message, "Invalid input");
  assertEquals(error.status, 400);
  assertEquals(error.code, "INVALID_INPUT");
  assertEquals(error.details, {
    errors: ["name is required", "email is invalid"]
  });
});

Deno.test("AuthError - Authentication and authorization", () => {
  const error = new AuthError("Unauthorized access", "UNAUTHORIZED", {
    required: ["admin"]
  });
  
  assertEquals(error.message, "Unauthorized access");
  assertEquals(error.status, 401);
  assertEquals(error.code, "UNAUTHORIZED");
  assertEquals(error.details, {
    required: ["admin"]
  });
});

Deno.test("ServerError - Internal server errors", () => {
  const error = new ServerError("Database error", "DB_ERROR", {
    operation: "insert",
    table: "users"
  });
  
  assertEquals(error.message, "Database error");
  assertEquals(error.status, 500);
  assertEquals(error.code, "DB_ERROR");
  assertEquals(error.details, {
    operation: "insert",
    table: "users"
  });
});

Deno.test("createErrorResponse - Error response creation", async () => {
  const error = new ValidationError("Invalid input", "INVALID_INPUT", {
    errors: ["name is required"]
  });
  
  const response = createErrorResponse(error);
  
  assertExists(response);
  assertEquals(response.status, 400);
  
  const contentType = response.headers.get("content-type");
  assertEquals(contentType, "application/json");
  
  const body = await response.text();
  const json = JSON.parse(body);
  assertEquals(json.error.message, "Invalid input");
  assertEquals(json.error.status, 400);
  assertEquals(json.error.code, "INVALID_INPUT");
  assertEquals(json.error.details, {
    errors: ["name is required"]
  });
});

Deno.test("Error response helpers", () => {
  // Test not found response
  const notFoundResponse = Errors.notFound("Resource not found", { id: "123" });
  assertEquals(notFoundResponse.error.status, 404);
  assertEquals(notFoundResponse.error.code, "RESOURCE_NOT_FOUND");
  
  // Test validation error response
  const validationResponse = Errors.badRequest("Invalid input", { errors: ["field required"] });
  assertEquals(validationResponse.error.status, 400);
  assertEquals(validationResponse.error.code, "BAD_REQUEST");
  
  // Test unauthorized response
  const unauthorizedResponse = Errors.unauthorized("Not authenticated");
  assertEquals(unauthorizedResponse.error.status, 401);
  assertEquals(unauthorizedResponse.error.code, "UNAUTHORIZED");
  
  // Test forbidden response
  const forbiddenResponse = Errors.forbidden("Access denied");
  assertEquals(forbiddenResponse.error.status, 403);
  assertEquals(forbiddenResponse.error.code, "FORBIDDEN");
  
  // Test conflict response
  const conflictResponse = Errors.conflict("Resource exists", { id: "123" });
  assertEquals(conflictResponse.error.status, 409);
  assertEquals(conflictResponse.error.code, "CONFLICT");
  
  // Test internal server error response
  const serverErrorResponse = Errors.internalServerError("Server error");
  assertEquals(serverErrorResponse.error.status, 500);
  assertEquals(serverErrorResponse.error.code, "INTERNAL_SERVER_ERROR");
}); 