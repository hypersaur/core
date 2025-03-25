import { Comment } from "../resources/comment.ts";

export class CommentService {
  private comments: Map<string, Comment> = new Map();

  async findByMemoId(memoId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.memoId === memoId);
  }

  async findById(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async create(memoId: string, data: Omit<Comment, "id" | "memoId" | "createdAt" | "updatedAt">): Promise<Comment> {
    const id = crypto.randomUUID();
    const now = new Date();
    const comment: Comment = {
      ...data,
      id,
      memoId,
      createdAt: now,
      updatedAt: now
    };
    this.comments.set(id, comment);
    return comment;
  }

  async update(id: string, data: Partial<Comment>): Promise<Comment> {
    const existing = this.comments.get(id);
    if (!existing) {
      throw new Error("Comment not found");
    }
    const updated: Comment = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.comments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.comments.has(id)) {
      throw new Error("Comment not found");
    }
    this.comments.delete(id);
  }
} 