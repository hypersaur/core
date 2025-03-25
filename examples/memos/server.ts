import { createServer, Router, HtmlRenderer, Resource } from "../../mod.ts";
import { MemoResource } from "./resources/memo.ts";
import { CommentResource } from "./resources/comment.ts";
import { MemoService } from "./services/memo_service.ts";
import { CommentService } from "./services/comment_service.ts";

// Create services
const memoService = new MemoService();
const commentService = new CommentService();

// Create resources
const memoResource = new MemoResource(memoService, commentService);
const commentResource = new CommentResource(commentService);

// Create server with HTML renderer
const server = createServer({
  renderer: new HtmlRenderer(),
});

// Get router from server
const router = server.getRouter();

// Define memo routes
router.get("/memos", async (req) => {
  const result = await memoResource.getCollection();
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.get("/memos/new", async (req) => {
  const result = new Resource({
    type: "memo",
    properties: {}
  });
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.get("/memos/:id", async (req, params) => {
  const result = await memoResource.get(params.id);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.get("/memos/:id/edit", async (req, params) => {
  const result = await memoResource.get(params.id);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.post("/memos", async (req) => {
  const data = await req.json();
  const result = await memoResource.post(data);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.put("/memos/:id", async (req, params) => {
  const data = await req.json();
  const result = await memoResource.put(params.id, data);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.delete("/memos/:id", async (req, params) => {
  await memoResource.delete(params.id);
  return new Response(null, { status: 204 });
});

// Define comment routes
router.get("/memos/:memoId/comments", async (req, params) => {
  const result = await commentResource.getCollection(params.memoId);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.get("/memos/:memoId/comments/new", async (req, params) => {
  const result = new Resource({
    type: "comment",
    properties: { memoId: params.memoId }
  });
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.get("/memos/:memoId/comments/:commentId", async (req, params) => {
  const result = await commentResource.get(params.memoId, params.commentId);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.get("/memos/:memoId/comments/:commentId/edit", async (req, params) => {
  const result = await commentResource.get(params.memoId, params.commentId);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.post("/memos/:memoId/comments", async (req, params) => {
  const data = await req.json();
  const result = await commentResource.post(params.memoId, data);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.put("/memos/:memoId/comments/:commentId", async (req, params) => {
  const data = await req.json();
  const result = await commentResource.put(params.memoId, params.commentId, data);
  return server.getRendererFactory().render(result, req.headers.get("Accept") || "*/*");
});

router.delete("/memos/:memoId/comments/:commentId", async (req, params) => {
  await commentResource.delete(params.memoId, params.commentId);
  return new Response(null, { status: 204 });
});

// Start server
await server.start(); 