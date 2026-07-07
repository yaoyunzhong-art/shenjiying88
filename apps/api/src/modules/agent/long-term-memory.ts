/**
 * long-term-memory.ts - Phase-23 T89
 * 长期记忆 (跨会话持久化)
 *
 * 三层记忆:
 * - Working Memory: 当前会话上下文 (短期)
 * - Episodic Memory: 历史事件 (e.g., "用户上次问过 X")
 * - Semantic Memory: 事实/概念 (e.g., "用户偏好深色主题")
 *
 * V2 mock 设计:
 * - In-memory store (生产接 PostgreSQL + pgvector)
 * - Consolidation: episodic → semantic 自动合并
 * - Importance scoring: 时间衰减 + 访问频次
 */
import { Injectable } from '@nestjs/common';

// ── Types ──

export type MemoryType = 'working' | 'episodic' | 'semantic';

export interface LongTermMemoryEntry {
  /** 唯一 key */
  key: string;
  /** 值 */
  value: unknown;
  /** 分类 (fact / preference / context) */
  category: 'fact' | 'preference' | 'context' | 'task';
  /** 记忆类型 */
  memoryType: MemoryType;
  /** 重要性分数 (0-1, 越高越不容易遗忘) */
  importance: number;
  /** 关联记忆 ids (用于知识图谱) */
  relatedIds: string[];
  /** embedding 向量 (用于语义检索) */
  embedding?: number[];
  /** 创建时间 */
  createdAt: number;
  /** 最后访问时间 (LRU) */
  lastAccessedAt: number;
  /** 访问次数 */
  accessCount: number;
  /** 过期时间 (ms, 0 = 永不过期) */
  ttlMs?: number;
}

// ── LongTermMemory ──

export interface LongTermMemoryConfig {
  maxSize?: number;
  defaultTtlMs?: number;
  /** 衰减半衰期 (天, 用于 importance 计算) */
  decayHalfLifeDays?: number;
}

@Injectable()
export class LongTermMemory {
  private readonly entries = new Map<string, LongTermMemoryEntry>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;
  private readonly decayHalfLifeDays: number;
  /** consolidation 阈值 (episodic 数量) */
  private readonly consolidationThreshold = 5;

  constructor(config: LongTermMemoryConfig = {}) {
    this.maxSize = config.maxSize ?? 5000;
    this.defaultTtlMs = config.defaultTtlMs ?? 30 * 24 * 60 * 60 * 1000; // 30 days
    this.decayHalfLifeDays = config.decayHalfLifeDays ?? 30;
  }

  /**
   * 存储记忆
   */
  store(entry: Omit<LongTermMemoryEntry, 'createdAt' | 'lastAccessedAt' | 'accessCount'> & { createdAt?: number }): void {
    const now = Date.now();
    const full: LongTermMemoryEntry = {
      ...entry,
      createdAt: entry.createdAt ?? now,
      lastAccessedAt: now,
      accessCount: 0,
    };
    this.entries.set(full.key, full);
    this.evictIfNeeded();
  }

  /**
   * 检索 (返回时不更新 access, 由 retrieveWithDecay 更新)
   */
  peek(key: string): LongTermMemoryEntry | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (this.isExpired(e)) {
      this.entries.delete(key);
      return undefined;
    }
    return e;
  }

  /**
   * 检索 (更新 access 时间)
   */
  retrieve(key: string): LongTermMemoryEntry | undefined {
    const e = this.peek(key);
    if (e) {
      e.lastAccessedAt = Date.now();
      e.accessCount++;
    }
    return e;
  }

  /**
   * 按类型列出
   */
  listByType(type: MemoryType): LongTermMemoryEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.memoryType === type);
  }

  /**
   * 按 category 列出
   */
  listByCategory(category: LongTermMemoryEntry['category']): LongTermMemoryEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.category === category);
  }

  /**
   * 删除
   */
  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  /**
   * 大小
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * 时间衰减后的 importance
   * formula: importance * 2^(-ageDays / halfLife)
   */
  getDecayedImportance(entry: LongTermMemoryEntry): number {
    const ageDays = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(0.5, ageDays / this.decayHalfLifeDays);
    return entry.importance * decayFactor;
  }

  /**
   * Consolidation: 将多条 episodic 合并为 semantic
   */
  consolidate(): { merged: number; removed: number } {
    const episodic = this.listByType('episodic');
    if (episodic.length < this.consolidationThreshold) {
      return { merged: 0, removed: 0 };
    }

    // 简化: 按 category 分组,合并为 semantic
    const grouped = new Map<string, LongTermMemoryEntry[]>();
    for (const e of episodic) {
      const group = grouped.get(e.category) ?? [];
      group.push(e);
      grouped.set(e.category, group);
    }

    let merged = 0;
    for (const [category, entries] of grouped) {
      if (entries.length < 2) continue;
      // 合并为 semantic entry
      const consolidatedKey = `semantic-${category}-${Date.now()}`;
      const avgImportance = entries.reduce((s, e) => s + e.importance, 0) / entries.length;
      this.store({
        key: consolidatedKey,
        value: { summaries: entries.map((e) => e.value) },
        category: category as 'fact' | 'context' | 'preference' | 'task',
        memoryType: 'semantic',
        importance: Math.min(1, avgImportance * 1.2),
        relatedIds: entries.map((e) => e.key),
      });
      // 删除 episodic
      for (const e of entries) {
        this.entries.delete(e.key);
      }
      merged++;
    }

    return { merged, removed: episodic.length };
  }

  /**
   * 清理: 删除已过期或 importance 太低的记忆
   */
  prune(minImportance = 0.1): number {
    const all = Array.from(this.entries.values());
    let removed = 0;
    for (const e of all) {
      if (this.getDecayedImportance(e) < minImportance) {
        this.entries.delete(e.key);
        removed++;
      }
    }
    return removed;
  }

  private isExpired(entry: LongTermMemoryEntry, now = Date.now()): boolean {
    return entry.ttlMs !== undefined && entry.ttlMs > 0 && now - entry.createdAt > entry.ttlMs;
  }

  private evictIfNeeded(): void {
    if (this.entries.size <= this.maxSize) return;
    const sorted = Array.from(this.entries.values()).sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
    const toRemove = sorted.slice(0, this.entries.size - this.maxSize);
    for (const entry of toRemove) {
      this.entries.delete(entry.key);
    }
  }
}
