import { Memo } from "../resources/memo.ts";

export class MemoService {
  private memos: Map<string, Memo> = new Map();

  async findAll(): Promise<Memo[]> {
    return Array.from(this.memos.values());
  }

  async findById(id: string): Promise<Memo | undefined> {
    return this.memos.get(id);
  }

  async create(data: Omit<Memo, "id" | "createdAt" | "updatedAt">): Promise<Memo> {
    const id = crypto.randomUUID();
    const now = new Date();
    const memo: Memo = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.memos.set(id, memo);
    return memo;
  }

  async update(id: string, data: Partial<Memo>): Promise<Memo> {
    const existing = this.memos.get(id);
    if (!existing) {
      throw new Error("Memo not found");
    }
    const updated: Memo = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.memos.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.memos.has(id)) {
      throw new Error("Memo not found");
    }
    this.memos.delete(id);
  }
} 