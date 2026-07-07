/**
 * self-reflection.ts - Phase-23 T88
 * 自我反思 (Self-Reflection) 与 Memory
 *
 * 模式:
 * - Reflection: Agent 在 Final Answer 后,自我评估答案质量
 *   - Score (0-1): 答案可信度
 *   - Issues: 检测到的问题
 *   - Improvement: 改进建议
 * - Memory: 跨会话记忆
 *   - Short-term: 当前会话上下文
 *   - Long-term: 跨会话持久化 (mock: in-memory)
 */
import { Injectable } from '@nestjs/common';
import type { AgentStep, AgentRunResult, LLM } from './agent-core';

// ── Reflection ──

export interface ReflectionScore {
  /** 答案相关性 (0-1) */
  relevance: number;
  /** 答案完整性 (0-1) */
  completeness: number;
  /** 答案准确性 (0-1, mock) */
  accuracy: number;
  /** 综合得分 (加权平均) */
  overall: number;
}

export interface Reflection {
  /** 评估的 step */
  step: number;
  /** 答案原文 */
  answer: string;
  /** 评分 */
  score: ReflectionScore;
  /** 检测到的问题 */
  issues: string[];
  /** 改进建议 */
  improvements: string[];
  /** 是否需要重试 */
  needsRetry: boolean;
  /** reflection 耗时 (ms) */
  durationMs: number;
}

export interface ReflectionConfig {
  /** 及格线 (低于此分需要重试,默认 0.6) */
  passThreshold?: number;
  /** 权重: relevance (默认 0.4) */
  relevanceWeight?: number;
  /** 权重: completeness (默认 0.3) */
  completenessWeight?: number;
  /** 权重: accuracy (默认 0.3) */
  accuracyWeight?: number;
  /** reflection 使用的 LLM (可选) */
  llm?: LLM;
}

@Injectable()
export class ReflectionEngine {
  private readonly config: Required<Omit<ReflectionConfig, 'llm'>> & { llm?: LLM };

  constructor(config: ReflectionConfig = {}) {
    this.config = {
      passThreshold: config.passThreshold ?? 0.6,
      relevanceWeight: config.relevanceWeight ?? 0.4,
      completenessWeight: config.completenessWeight ?? 0.3,
      accuracyWeight: config.accuracyWeight ?? 0.3,
      llm: config.llm,
    };
  }

  /**
   * 反思: 评估 agent 结果
   */
  async reflect(result: AgentRunResult, originalQuery: string): Promise<Reflection> {
    const start = Date.now();
    const lastStep = result.steps[result.steps.length - 1];
    const answer = result.finalAnswer;

    // V2 mock: 基于启发式评分
    const relevance = this.scoreRelevance(answer, originalQuery);
    const completeness = this.scoreCompleteness(result, originalQuery);
    const accuracy = this.scoreAccuracy(answer, result);

    const overall =
      relevance * this.config.relevanceWeight +
      completeness * this.config.completenessWeight +
      accuracy * this.config.accuracyWeight;

    const issues: string[] = [];
    const improvements: string[] = [];

    if (relevance < 0.5) {
      issues.push('Answer may not address the query');
      improvements.push('Re-query with more specific terms');
    }
    if (completeness < 0.5) {
      issues.push('Answer may be incomplete');
      improvements.push('Gather more information before answering');
    }
    if (accuracy < 0.5) {
      issues.push('Answer confidence is low');
      improvements.push('Verify with additional sources');
    }
    if (result.steps.length >= 10) {
      issues.push(`Reached max steps (${result.steps.length})`);
      improvements.push('Increase maxSteps or simplify query');
    }

    return {
      step: lastStep?.step ?? 0,
      answer,
      score: { relevance, completeness, accuracy, overall },
      issues,
      improvements,
      needsRetry: overall < this.config.passThreshold,
      durationMs: Date.now() - start,
    };
  }

  /**
   * 反思单个 step (在 ReAct 循环中插入)
   */
  async reflectStep(step: AgentStep, context: { query: string; history: AgentStep[] }): Promise<Reflection> {
    const syntheticResult: AgentRunResult = {
      steps: [...context.history, step],
      finalAnswer: step.finalAnswer ?? step.thought,
      success: !!step.finalAnswer,
      totalUsage: { promptTokens: 0, completionTokens: 0 },
      totalDurationMs: step.durationMs,
    };
    return this.reflect(syntheticResult, context.query);
  }

  // ── Private Scoring (V2 mock) ──

  private scoreRelevance(answer: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const answerLower = answer.toLowerCase();
    const matched = queryWords.filter((w) => answerLower.includes(w)).length;
    return queryWords.length === 0 ? 1 : matched / queryWords.length;
  }

  private scoreCompleteness(result: AgentRunResult, _query: string): number {
    // 简化: steps 越多越完整,但 max steps 反而不好
    const steps = result.steps.length;
    if (steps === 0) return 0;
    if (steps < 3) return 0.5;
    if (steps < 7) return 0.9;
    if (steps < 10) return 0.7;
    return 0.4;
  }

  private scoreAccuracy(answer: string, result: AgentRunResult): number {
    // V2 mock: answer 含 "error" / "unable" / "i don't know" → 低分
    const lower = answer.toLowerCase();
    if (lower.includes('error') || lower.includes('unable') || lower.includes("i don't know")) {
      return 0.3;
    }
    if (result.success && answer.length > 10) return 0.8;
    if (answer.length > 5) return 0.6;
    return 0.4;
  }
}

// ── Memory ──

export interface MemoryEntry {
  /** 唯一 key */
  key: string;
  /** 值 */
  value: unknown;
  /** 分类 (fact / preference / context) */
  category: 'fact' | 'preference' | 'context' | 'task';
  /** 创建时间 */
  createdAt: number;
  /** 最后访问时间 (LRU) */
  lastAccessedAt: number;
  /** 访问次数 */
  accessCount: number;
  /** 过期时间 (ms, 0 = 永不过期) */
  ttlMs?: number;
}

export interface MemoryConfig {
  /** 最大容量 (LRU 淘汰,默认 1000) */
  maxSize?: number;
  /** 默认 TTL ms (默认 24h) */
  defaultTtlMs?: number;
}

@Injectable()
export class AgentMemory {
  private readonly store = new Map<string, MemoryEntry>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(config: MemoryConfig = {}) {
    this.maxSize = config.maxSize ?? 1000;
    this.defaultTtlMs = config.defaultTtlMs ?? 24 * 60 * 60 * 1000;
  }

  /**
   * 存储
   */
  set(key: string, value: unknown, category: MemoryEntry['category'] = 'context', ttlMs?: number): void {
    const now = Date.now();
    this.store.set(key, {
      key,
      value,
      category,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      ttlMs: ttlMs ?? this.defaultTtlMs,
    });
    this.evictIfNeeded();
  }

  /**
   * 获取 (LRU 更新)
   */
  get(key: string): unknown | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;
    return entry.value;
  }

  /**
   * 删除
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * 按 category 列出
   */
  listByCategory(category: MemoryEntry['category']): MemoryEntry[] {
    return Array.from(this.store.values()).filter((e) => e.category === category);
  }

  /**
   * 大小
   */
  size(): number {
    return this.store.size;
  }

  /**
   * 清理过期
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (this.isExpired(entry, now)) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  private isExpired(entry: MemoryEntry, now = Date.now()): boolean {
    return entry.ttlMs !== undefined && entry.ttlMs > 0 && now - entry.createdAt > entry.ttlMs;
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.maxSize) return;
    // LRU: 按 lastAccessedAt 排序,删除最旧
    const sorted = Array.from(this.store.values()).sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
    const toRemove = sorted.slice(0, this.store.size - this.maxSize);
    for (const entry of toRemove) {
      this.store.delete(entry.key);
    }
  }
}
