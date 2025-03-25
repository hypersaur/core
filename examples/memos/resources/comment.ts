import { Resource, Collection, LinkManager, STANDARD_RELS } from "../../../mod.ts";
import { CommentService } from "../services/comment_service.ts";

export interface Comment {
  id: string;
  memoId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentResource extends Resource {
  constructor(
    private commentService: CommentService
  ) {
    super();
  }

  async getCollection(memoId: string) {
    const comments = await this.commentService.findByMemoId(memoId);
    const collection = new Collection({
      type: "comments",
      items: comments.map(comment => this.createCommentResource(comment))
    });
    return collection;
  }

  async get(memoId: string, id: string) {
    const comment = await this.commentService.findById(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    return this.createCommentResource(comment);
  }

  async post(memoId: string, data: Omit<Comment, "id" | "createdAt" | "updatedAt">) {
    const comment = await this.commentService.create(memoId, data);
    return this.createCommentResource(comment);
  }

  async put(memoId: string, id: string, data: Partial<Comment>) {
    const comment = await this.commentService.update(id, data);
    return this.createCommentResource(comment);
  }

  async delete(memoId: string, id: string) {
    await this.commentService.delete(id);
  }

  private createCommentResource(comment: Comment) {
    const resource = new Resource({
      type: "comment",
      id: comment.id,
      properties: {
        memoId: comment.memoId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      }
    });
    
    // Add standard links
    resource.addLink(STANDARD_RELS.SELF, `/memos/${comment.memoId}/comments/${comment.id}`);
    resource.addLink(STANDARD_RELS.EDIT, `/memos/${comment.memoId}/comments/${comment.id}`);
    resource.addLink(STANDARD_RELS.DELETE, `/memos/${comment.memoId}/comments/${comment.id}`);
    
    // Add memo link
    resource.addLink("memo", `/memos/${comment.memoId}`);

    return resource;
  }
} 