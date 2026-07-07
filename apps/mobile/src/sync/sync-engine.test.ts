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
});