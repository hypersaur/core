import { Resource, Collection, LinkManager, STANDARD_RELS } from "../../../mod.ts";
import { MemoService } from "../services/memo_service.ts";
import { CommentService } from "../services/comment_service.ts";

export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MemoResource extends Resource {
  constructor(
    private memoService: MemoService,
    private commentService: CommentService
  ) {
    super();
  }

  async getCollection() {
    const memos = await this.memoService.findAll();
    const collection = new Collection({
      type: "memos",
      items: memos.map(memo => this.createMemoResource(memo))
    });
    return collection;
  }

  async get(id: string) {
    const memo = await this.memoService.findById(id);
    if (!memo) {
      throw new Error("Memo not found");
    }
    return this.createMemoResource(memo);
  }

  async post(data: Omit<Memo, "id" | "createdAt" | "updatedAt">) {
    const memo = await this.memoService.create(data);
    return this.createMemoResource(memo);
  }

  async put(id: string, data: Partial<Memo>) {
    const memo = await this.memoService.update(id, data);
    return this.createMemoResource(memo);
  }

  async delete(id: string) {
    await this.memoService.delete(id);
  }

  private createMemoResource(memo: Memo) {
    const resource = new Resource({
      type: "memo",
      id: memo.id,
      properties: {
        title: memo.title,
        content: memo.content,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt
      }
    });
    
    // Add standard links
    resource.addLink(STANDARD_RELS.SELF, `/memos/${memo.id}`);
    resource.addLink(STANDARD_RELS.EDIT, `/memos/${memo.id}`);
    resource.addLink(STANDARD_RELS.DELETE, `/memos/${memo.id}`);
    
    // Add comments link
    resource.addLink("comments", `/memos/${memo.id}/comments`);

    // Add embedded comments
    resource.setProperty("_embedded", {
      comments: this.commentService.findByMemoId(memo.id)
    });

    return resource;
  }
} 