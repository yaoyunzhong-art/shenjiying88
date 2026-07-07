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
  };

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
  }> {
    const fetcher =
      this.options.fetcher ?? this.mockFetcher();
    const pageSize = this.options.pageSize ?? 100;
    let totalPulled = 0;
    let totalConflicts = 0;
    let currentVersion = this.lastSyncVersion;

    let hasMore = true;
    while (hasMore) {
      const delta = await fetcher(this.lastSyncVersion, pageSize);
      for (const change of delta.changes) {
        const result = this.store.mergeRemote(change);
        totalConflicts += result.conflictsResolved;
        totalFieldsSynced(result, this);
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

    return { pulled: totalPulled, version: currentVersion, conflictsResolved: totalConflicts, hasMore: false };
  }

  /**
   * 推送本地变更 (V1 mock: 通过 offline-queue)
   */
  async push(localDocs: CRDTDocument[]): Promise<{ pushed: number; version: number }> {
    // Mock: 服务器接收后,version 递增
    const pushed = localDocs.length;
    this.lastSyncVersion += 1;
    this.lastSyncAt = new Date().toISOString();
    this.stats.lastSyncVersion = this.lastSyncVersion;
    this.stats.lastSyncAt = this.lastSyncAt;
    this.stats.totalPushes += pushed;
    return { pushed, version: this.lastSyncVersion };
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
    };
  }
}

function totalFieldsSynced(
  result: { merged: CRDTDocument; conflictsResolved: number; fieldsAdded: number },
  engine: SyncEngine,
): void {
  engine['stats'].totalFieldsSynced =
    engine['stats'].totalFieldsSynced + Object.keys(result.merged.fields).length;
}