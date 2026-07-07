/**
 * offline-queue.ts - Phase-21 T56
 * 离线写操作队列 (Offline-First)
 *
 * 设计:
 * - 写操作(POST/PUT/DELETE) → 进入队列
 * - 队列持久化到 AsyncStorage (V1) / WatermelonDB (V2)
 * - 在线时按 FIFO 顺序 flush
 * - 失败重试 + 指数退避
 *
 * V1 纯 TS 实现,可独立单测;V2 集成 AsyncStorage
 */
import { v4 as uuidv4 } from 'uuid';

export type QueueOpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface QueuedOperation<TBody = unknown> {
  id: string;
  tenantId: string;
  method: QueueOpMethod;
  url: string;
  body?: TBody;
  createdAt: string;
  attempts: number;
  /** 最大重试次数,超过后进 dead-letter */
  maxAttempts: number;
  /** 下次可重试时间 (毫秒时间戳) */
  nextAttemptAt: number;
  /** 失败原因 (最后一次) */
  lastError?: string;
  status: 'pending' | 'in-flight' | 'failed' | 'dead-letter' | 'completed';
}

export interface FlushResult {
  attempted: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  durationMs: number;
}

export interface QueuedRequester {
  /** 实际发起请求的函数,成功返回 true,失败抛出 */
  send: <TBody>(op: QueuedOperation<TBody>) => Promise<void>;
  /** 当前是否在线 */
  isOnline: () => boolean;
}

/** 默认重试: 指数退避 1s, 2s, 4s, 8s, 16s ... */
function calcBackoff(attempts: number, baseMs = 1000): number {
  return baseMs * Math.pow(2, Math.max(0, attempts - 1));
}

export class OfflineQueue {
  private readonly queue: QueuedOperation[] = [];
  private readonly listeners = new Set<() => void>();
  private flushInProgress = false;

  constructor(
    private readonly requester: QueuedRequester,
    private readonly options: {
      defaultMaxAttempts?: number;
      autoFlush?: boolean;
    } = {},
  ) {}

  // ── Subscribe ──

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  // ── Queue ops ──

  enqueue<TBody>(input: {
    tenantId: string;
    method: QueueOpMethod;
    url: string;
    body?: TBody;
    maxAttempts?: number;
  }): QueuedOperation<TBody> {
    const maxAttempts = input.maxAttempts ?? this.options.defaultMaxAttempts ?? 5;
    const op: QueuedOperation<TBody> = {
      id: uuidv4(),
      tenantId: input.tenantId,
      method: input.method,
      url: input.url,
      body: input.body,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts,
      nextAttemptAt: Date.now(),
      status: 'pending',
    };
    this.queue.push(op as QueuedOperation);
    this.notify();

    if (this.options.autoFlush !== false) {
      // 异步触发,不阻塞
      this.flush().catch((err) => console.warn('[queue] auto-flush failed:', err));
    }
    return op;
  }

  /**
   * Flush 所有可执行操作 (pending 状态 + nextAttemptAt <= now)
   */
  async flush(): Promise<FlushResult> {
    if (this.flushInProgress) {
      return { attempted: 0, succeeded: 0, failed: 0, deadLettered: 0, durationMs: 0 };
    }
    this.flushInProgress = true;
    const start = Date.now();

    let attempted = 0;
    let succeeded = 0;
    let failed = 0;
    let deadLettered = 0;

    try {
      if (!this.requester.isOnline()) {
        return { attempted, succeeded, failed, deadLettered, durationMs: 0 };
      }

      const now = Date.now();
      const ready = this.queue.filter(
        (op) =>
          (op.status === 'pending' || op.status === 'failed') &&
          op.nextAttemptAt <= now,
      );

      for (const op of ready) {
        if (!this.requester.isOnline()) break; // 断网停止
        attempted += 1;
        op.status = 'in-flight';
        op.attempts += 1;
        try {
          await this.requester.send(op);
          op.status = 'completed';
          succeeded += 1;
        } catch (err) {
          op.lastError = (err as Error).message;
          if (op.attempts >= op.maxAttempts) {
            op.status = 'dead-letter';
            deadLettered += 1;
          } else {
            op.status = 'failed';
            op.nextAttemptAt = Date.now() + calcBackoff(op.attempts);
            failed += 1;
          }
        }
        this.notify();
      }
    } finally {
      this.flushInProgress = false;
    }

    return { attempted, succeeded, failed, deadLettered, durationMs: Date.now() - start };
  }

  // ── Query ──

  size(): number {
    return this.queue.length;
  }

  /** 统计各状态数量 */
  stats(): Record<QueuedOperation['status'], number> {
    const result = { pending: 0, 'in-flight': 0, failed: 0, 'dead-letter': 0, completed: 0 };
    for (const op of this.queue) result[op.status] += 1;
    return result;
  }

  /** 取快照 */
  snapshot(): QueuedOperation[] {
    return [...this.queue];
  }

  /** 取指定状态 */
  list(status?: QueuedOperation['status']): QueuedOperation[] {
    return status ? this.queue.filter((op) => op.status === status) : [...this.queue];
  }

  /** 手动重试 dead-letter 中的某条 */
  retry(opId: string): void {
    const op = this.queue.find((o) => o.id === opId);
    if (!op || op.status !== 'dead-letter') return;
    op.status = 'pending';
    op.attempts = 0;
    op.nextAttemptAt = Date.now();
    this.notify();
  }

  /** 清空 completed */
  clearCompleted(): number {
    const before = this.queue.length;
    const remaining = this.queue.filter((op) => op.status !== 'completed');
    this.queue.length = 0;
    this.queue.push(...remaining);
    const removed = before - remaining.length;
    this.notify();
    return removed;
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.queue.length = 0;
    this.flushInProgress = false;
  }
}