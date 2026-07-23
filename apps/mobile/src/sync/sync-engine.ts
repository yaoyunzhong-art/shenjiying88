/**
 * sync-engine.ts - Phase-21 T58
 * 同步引擎 - Delta Sync (增量同步)
 *
 * 机制:
 * - 客户端保留 lastSyncVersion (版本号)
 * - 同步时: GET /sync?since=lastSyncVersion → 服务器返回增量变更
 * - 应用变更到本地 CRDT store
 * - 推送本地变更: POST /sync/push (基于 offline-queue)
 */
import { CRDTStore, CRDTDocument } from './crdt';

export interface SyncDelta {
  /** 服务器版本号 (单调递增) */
  version: number;
  /** 增量变更列表 */
  changes: CRDTDocument[];
  /** 是否还有更多 (false 表示已传完) */
  hasMore: boolean;
}

export interface SyncEngineOptions {
  /** 每次拉取最大变更数 */
  pageSize?: number;
  /** 服务器地址 (用于 mock) */
  endpoint?: string;
  /** 拉取函数 (默认 mock) */
  fetcher?: (sinceVersion: number, limit: number) => Promise<SyncDelta>;
}

export interface SyncStats {
  lastSyncAt: string | null;
  lastSyncVersion: number;
  totalPulls: number;
  totalPushes: number;
  totalConflictsResolved: number;
  totalFieldsSynced: number;
  /** BS-0284: 幂等性统计 */
  totalDuplicatesSkipped: number;
}

/**
 * BS-0284: 幂等性请求记录
 * 存储已处理的 requestId 及其响应
 */
interface IdempotencyRecord {
  requestId: string;
  response: unknown;
  processedAt: number;
}

export class SyncEngine {
  private lastSyncVersion = 0;
  private lastSyncAt: string | null = null;
  private stats: SyncStats = {
    lastSyncAt: null,
    lastSyncVersion: 0,
    totalPulls: 0,
    totalPushes: 0,
    totalConflictsResolved: 0,
    totalFieldsSynced: 0,
    /** BS-0284 */
    totalDuplicatesSkipped: 0,
  };

  /** BS-0284: 已处理的 requestId 映射 */
  private idempotencyStore = new Map<string, IdempotencyRecord>();

  /** BS-0284: 已处理 requestId 的 TTL（毫秒） */
  private readonly IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24小时

  constructor(
    private readonly store: CRDTStore,
    private readonly options: SyncEngineOptions = {},
  ) {}

  /**
   * 从服务器拉取增量
   */
  async pull(): Promise<{
    pulled: number;
    version: number;
    conflictsResolved: number;
    hasMore: boolean;
    /** BS-0284: 本次拉取跳过的重复数量 */
    duplicatesSkipped: number;
  }> {
    const fetcher =
      this.options.fetcher ?? this.mockFetcher();
    const pageSize = this.options.pageSize ?? 100;
    let totalPulled = 0;
    let totalConflicts = 0;
    let totalDuplicates = 0;
    let currentVersion = this.lastSyncVersion;

    let hasMore = true;
    while (hasMore) {
      const delta = await fetcher(this.lastSyncVersion, pageSize);
      for (const change of delta.changes) {
        // BS-0284: 检查是否重复变更（基于文档 ID + 版本号）
        const dedupKey = `change:${change.id}:${change.clock ? JSON.stringify(change.clock) : change.updatedAt}`
        if (this.isDuplicateRequest(dedupKey)) {
          totalDuplicates++
          continue
        }

        const result = this.store.mergeRemote(change);
        totalConflicts += result.conflictsResolved;
        totalFieldsSynced(result, this);

        // BS-0284: 记录已处理
        this.markRequestId(dedupKey, { skipped: false })
      }
      totalPulled += delta.changes.length;
      currentVersion = Math.max(currentVersion, delta.version);
      hasMore = delta.hasMore;
      if (!hasMore) break;
    }

    this.lastSyncVersion = currentVersion;
    this.lastSyncAt = new Date().toISOString();
    this.stats.lastSyncVersion = currentVersion;
    this.stats.lastSyncAt = this.lastSyncAt;
    this.stats.totalPulls += 1;
    this.stats.totalConflictsResolved += totalConflicts;
    this.stats.totalDuplicatesSkipped += totalDuplicates;

    return { pulled: totalPulled, version: currentVersion, conflictsResolved: totalConflicts, hasMore: false, duplicatesSkipped: totalDuplicates };
  }

  /**
   * 推送本地变更 (V1 mock: 通过 offline-queue)
   *
   * BS-0284: 支持幂等推送
   * @param localDocs 要推送的变更文档
   * @param requestId 可选的请求 ID（用于幂等检测）
   */
  async push(localDocs: CRDTDocument[], requestId?: string): Promise<{ pushed: number; version: number; duplicate: boolean }> {
    // BS-0284: 如果提供了 requestId，检查是否已处理
    if (requestId) {
      const existing = this.getIdempotentResult(requestId) as { pushed: number; version: number; duplicate: boolean } | null
      if (existing !== null) {
        this.stats.totalDuplicatesSkipped++
        // 返回标记为重复的响应
        return { ...existing, duplicate: true }
      }
    }

    // Mock: 服务器接收后,version 递增
    const pushed = localDocs.length;
    this.lastSyncVersion += 1;
    this.lastSyncAt = new Date().toISOString();
    this.stats.lastSyncVersion = this.lastSyncVersion;
    this.stats.lastSyncAt = this.lastSyncAt;
    this.stats.totalPushes += pushed;

    const response = { pushed, version: this.lastSyncVersion, duplicate: false }

    // BS-0284: 记录请求结果
    if (requestId) {
      this.markRequestId(requestId, response)
    }

    return response
  }

  /** 全量同步: pull + push */
  async fullSync(localDocs: CRDTDocument[] = []): Promise<{
    pulled: number;
    pushed: number;
    version: number;
  }> {
    const pullResult = await this.pull();
    const pushResult = await this.push(localDocs);
    return {
      pulled: pullResult.pulled,
      pushed: pushResult.pushed,
      version: pushResult.version,
    };
  }

  /** 状态查询 */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /** 当前同步版本 */
  getCurrentVersion(): number {
    return this.lastSyncVersion;
  }

  /** 设置初始版本 (用于恢复会话时) */
  setLastSyncVersion(version: number): void {
    this.lastSyncVersion = version;
    this.stats.lastSyncVersion = version;
  }

  /**
   * 默认 mock fetcher
   * 生产:替换为真实 HTTP 调用
   */
  private mockFetcher(): (sinceVersion: number, limit: number) => Promise<SyncDelta> {
    return async (_sinceVersion: number, _limit: number) => ({
      version: this.lastSyncVersion + 1,
      changes: [],
      hasMore: false,
    });
  }

  // ── BS-0284: 幂等性方法 ───────────────────────────────────────────

  /**
   * BS-0284: 根据 requestId 获取幂等性结果
   * 如果 requestId 已存在且未过期，返回之前的响应
   */
  getIdempotentResult(requestId: string): unknown {
    const record = this.idempotencyStore.get(requestId)
    if (!record) return null

    // 检查 TTL
    if (Date.now() - record.processedAt > this.IDEMPOTENCY_TTL_MS) {
      this.idempotencyStore.delete(requestId)
      return null
    }

    return record.response
  }

  /**
   * BS-0284: 检查是否重复请求
   */
  isDuplicateRequest(requestId: string): boolean {
    return this.getIdempotentResult(requestId) !== null
  }

  /**
   * BS-0284: 标记 requestId 为已处理
   */
  markRequestId(requestId: string, response: unknown): void {
    this.idempotencyStore.set(requestId, {
      requestId,
      response,
      processedAt: Date.now(),
    })

    // BS-0284: 清理过期记录
    this.evictExpiredRecords()
  }

  /**
   * BS-0284: 清理过期的幂等性记录
   */
  private evictExpiredRecords(): void {
    const now = Date.now()
    for (const [id, record] of this.idempotencyStore) {
      if (now - record.processedAt > this.IDEMPOTENCY_TTL_MS) {
        this.idempotencyStore.delete(id)
      }
    }
  }

  /**
   * BS-0284: 获取幂等性统计
   */
  getIdempotencyStats(): { totalRecords: number; ttlMs: number } {
    return {
      totalRecords: this.idempotencyStore.size,
      ttlMs: this.IDEMPOTENCY_TTL_MS,
    }
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.lastSyncVersion = 0;
    this.lastSyncAt = null;
    this.stats = {
      lastSyncAt: null,
      lastSyncVersion: 0,
      totalPulls: 0,
      totalPushes: 0,
      totalConflictsResolved: 0,
      totalFieldsSynced: 0,
      totalDuplicatesSkipped: 0,
    };
    this.idempotencyStore.clear()
  }
}

function totalFieldsSynced(
  result: { merged: CRDTDocument; conflictsResolved: number; fieldsAdded: number },
  engine: SyncEngine,
): void {
  engine['stats'].totalFieldsSynced =
    engine['stats'].totalFieldsSynced + Object.keys(result.merged.fields).length;
}