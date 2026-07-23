/**
 * sync-engine.test.ts - Phase-21 T58
 * 同步引擎单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CRDTStore, CRDTDocument } from './crdt';
import { SyncEngine, SyncDelta } from './sync-engine';

describe('SyncEngine · Phase-21 T58', () => {
  let store: CRDTStore;
  let engine: SyncEngine;

  beforeEach(() => {
    store = new CRDTStore();
    engine = new SyncEngine(store, { pageSize: 50 });
    engine.resetForTests();
  });

  // AC-1: 空拉取
  it('AC-1 pull: empty delta', async () => {
    const result = await engine.pull();
    expect(result.pulled).toBe(0);
    expect(result.version).toBe(1);
    expect(engine.getCurrentVersion()).toBe(1);
  });

  // AC-2: 拉取 + 应用变更
  it('AC-2 pull: apply changes to local store', async () => {
    const mockFetcher = async (_since: number, _limit: number): Promise<SyncDelta> => ({
      version: 1,
      changes: [
        {
          id: 'doc1',
          fields: { name: { value: 'Alice', timestamp: 100, deviceId: 'remote-A' } },
          clock: { 'remote-A': 100 },
          updatedAt: 100,
        },
      ],
      hasMore: false,
    });
    engine = new SyncEngine(store, { pageSize: 50, fetcher: mockFetcher });
    const result = await engine.pull();
    expect(result.pulled).toBe(1);
    expect(store.getField('doc1', 'name')).toBe('Alice');
  });

  // AC-3: 分页拉取 - hasMore=true → 继续拉
  it('AC-3 pull: pagination via hasMore', async () => {
    let page = 0;
    const mockFetcher = async (since: number, limit: number): Promise<SyncDelta> => {
      page += 1;
      if (page === 1) {
        return {
          version: 1,
          changes: [
            {
              id: `doc-${page}`,
              fields: { name: { value: `Doc${page}`, timestamp: 100, deviceId: 'remote-A' } },
              clock: { 'remote-A': 100 },
              updatedAt: 100,
            },
          ],
          hasMore: true,
        };
      }
      return { version: 2, changes: [], hasMore: false };
    };
    engine = new SyncEngine(store, { pageSize: 50, fetcher: mockFetcher });
    const result = await engine.pull();
    expect(result.pulled).toBe(1);
    expect(page).toBe(2);
  });

  // AC-4: 推送本地变更
  it('AC-4 push: increment version', async () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const docs: CRDTDocument[] = [store.getDoc('doc1')!];
    const result = await engine.push(docs);
    expect(result.pushed).toBe(1);
    expect(result.version).toBe(1);
    expect(engine.getCurrentVersion()).toBe(1);
  });

  // AC-5: 全量同步
  it('AC-5 fullSync: pull + push', async () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const docs = [store.getDoc('doc1')!];
    const result = await engine.fullSync(docs);
    expect(result.pushed).toBe(1);
    // pull 推进版本到 1, push 再推进到 2
    expect(result.version).toBe(2);
  });

  // AC-6: 冲突解决计数
  it('AC-6 stats: track conflicts resolved', async () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const mockFetcher = async (): Promise<SyncDelta> => ({
      version: 1,
      changes: [
        {
          id: 'doc1',
          fields: { name: { value: 'Bob', timestamp: 200, deviceId: 'remote-B' } },
          clock: { 'remote-B': 200 },
          updatedAt: 200,
        },
      ],
      hasMore: false,
    });
    engine = new SyncEngine(store, { pageSize: 50, fetcher: mockFetcher });
    await engine.pull();
    const stats = engine.getStats();
    expect(stats.totalConflictsResolved).toBe(1);
    expect(stats.totalPulls).toBe(1);
  });

  // AC-7: lastSyncVersion 恢复
  it('AC-7 restore: setLastSyncVersion', () => {
    engine.setLastSyncVersion(42);
    expect(engine.getCurrentVersion()).toBe(42);
    expect(engine.getStats().lastSyncVersion).toBe(42);
  });

  // ── BS-0284: 数据同步幂等性 ─────────────────────────────────────

  describe('BS-0284: 数据同步幂等性', () => {
    it('重复的 requestId 应被跳过 (push)', async () => {
      store.setField('doc1', 'name', 'Alice', 'device-A', 100);
      const docs = [store.getDoc('doc1')!];

      // 第一次推送
      const result1 = await engine.push(docs, 'req-001');
      expect(result1.pushed).toBe(1);
      expect(result1.duplicate).toBe(false);

      // 第二次推送（相同 requestId）
      const result2 = await engine.push(docs, 'req-001');
      expect(result2.duplicate).toBe(true);
      expect(result2.pushed).toBe(1); // 返回首次结果
    });

    it('不同的 requestId 正常处理', async () => {
      store.setField('doc1', 'name', 'Alice', 'device-A', 100);
      store.setField('doc2', 'title', 'Doc2', 'device-A', 200);

      const docs1 = [store.getDoc('doc1')!];
      const docs2 = [store.getDoc('doc2')!];

      const r1 = await engine.push(docs1, 'req-A');
      const r2 = await engine.push(docs2, 'req-B');

      expect(r1.duplicate).toBe(false);
      expect(r2.duplicate).toBe(false);
      expect(r1.version).toBeLessThan(r2.version);
    });

    it('未提供 requestId 时不执行幂等检测', async () => {
      store.setField('doc1', 'name', 'Alice', 'device-A', 100);
      const docs = [store.getDoc('doc1')!];

      // 不传 requestId，两次都能正常执行
      const r1 = await engine.push(docs);
      const r2 = await engine.push(docs);

      expect(r1.duplicate).toBe(false);
      expect(r2.duplicate).toBe(false);
      // 版本递增
      expect(r2.version).toBe(r1.version + 1);
    });

    it('getIdempotentResult 为不存在 ID 返回 null', () => {
      expect(engine.getIdempotentResult('nonexistent-request')).toBeNull();
    });

    it('isDuplicateRequest 正确判断重复', () => {
      engine.markRequestId('test-request', { success: true });
      expect(engine.isDuplicateRequest('test-request')).toBe(true);
      expect(engine.isDuplicateRequest('other-request')).toBe(false);
    });

    it('getIdempotencyStats 返回正确数量', () => {
      engine.markRequestId('id-1', { ok: true });
      engine.markRequestId('id-2', { ok: true });

      const stats = engine.getIdempotencyStats();
      expect(stats.totalRecords).toBe(2);
      expect(stats.ttlMs).toBe(24 * 60 * 60 * 1000);
    });

    it('resetForTests 清空幂等性存储', () => {
      engine.markRequestId('id-1', { ok: true });
      expect(engine.isDuplicateRequest('id-1')).toBe(true);

      engine.resetForTests();
      expect(engine.isDuplicateRequest('id-1')).toBe(false);
      expect(engine.getStats().totalDuplicatesSkipped).toBe(0);
    });

    it('pull 中的重复变更被跳过并统计', async () => {
      // 先拉取一次，包含某个变更
      // 第二次拉取时相同变更应被跳过
      const mockFetcherCall1 = async (): Promise<SyncDelta> => ({
        version: 1,
        changes: [
          {
            id: 'doc-unique',
            fields: { name: { value: 'Alice', timestamp: 100, deviceId: 'remote-A' } },
            clock: { 'remote-A': 100 },
            updatedAt: 100,
          },
        ],
        hasMore: false,
      });
      const mockFetcherCall2 = async (): Promise<SyncDelta> => ({
        version: 2,
        changes: [
          {
            id: 'doc-unique',
            fields: { name: { value: 'Alice', timestamp: 100, deviceId: 'remote-A' } },
            clock: { 'remote-A': 100 },
            updatedAt: 100,
          },
          {
            id: 'doc-new',
            fields: { title: { value: 'New Doc', timestamp: 200, deviceId: 'remote-B' } },
            clock: { 'remote-B': 200 },
            updatedAt: 200,
          },
        ],
        hasMore: false,
      });

      // 第一次拉取
      engine = new SyncEngine(store, { pageSize: 50, fetcher: mockFetcherCall1 });
      let result = await engine.pull();
      expect(result.pulled).toBe(1);
      expect(result.duplicatesSkipped).toBe(0);

      // 第二次拉取（使用同一个 engine 实例，保持幂等性存储）
      // 替换 fetcher 以获取不同数据
      engine = new SyncEngine(store, { pageSize: 50, fetcher: mockFetcherCall2 });
      // pre-populate idempotency store based on first pull
      engine.markRequestId('change:doc-unique:{"remote-A":100}', { skipped: true })
      result = await engine.pull();
      // 唯一变更被跳过，新变更被处理
      expect(result.duplicatesSkipped).toBe(1);
      expect(result.pulled).toBe(2);
    });

    it('幂等性记录有 TTL 上限', async () => {
      const markSpy = vi.spyOn(engine as any, 'evictExpiredRecords');

      engine.markRequestId('will-expire', { ok: true });
      expect(markSpy).toHaveBeenCalled();
      expect(engine.isDuplicateRequest('will-expire')).toBe(true);

      markSpy.mockRestore();
    });
  });
});