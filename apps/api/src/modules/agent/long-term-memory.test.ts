import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * long-term-memory.test.ts - Phase-23 T89
 * 长期记忆单元测试
 */
import assert from 'node:assert/strict';
import { LongTermMemory } from './long-term-memory';

describe('LongTermMemory · 基本', () => {
  let memory: LongTermMemory;
  beforeEach(() => {
    memory = new LongTermMemory();
  });

  it('AC-1 store + retrieve', () => {
    (memory as any).store({
      key: 'user-pref-1',
      value: { theme: 'dark' },
      category: 'preference',
      memoryType: 'semantic',
      importance: 0.9,
      relatedIds: [],
    });
    const e = memory.retrieve('user-pref-1');
    assert.ok(e);
    assert.equal(e?.memoryType, 'semantic');
    assert.equal((e?.value as { theme: string }).theme, 'dark');
  });

  it('AC-2 不存在 key 返回 undefined', () => {
    assert.equal(memory.retrieve('nonexistent'), undefined);
  });

  it('AC-3 size 统计', () => {
    (memory as any).store({ key: 'a', value: 1, category: 'fact', memoryType: 'working', importance: 0.5, relatedIds: [] });
    (memory as any).store({ key: 'b', value: 2, category: 'fact', memoryType: 'working', importance: 0.5, relatedIds: [] });
    assert.equal(memory.size(), 2);
  });

  it('AC-4 listByType 分类', () => {
    (memory as any).store({ key: 'w1', value: 'working', category: 'context', memoryType: 'working', importance: 0.5, relatedIds: [] });
    (memory as any).store({ key: 'e1', value: 'episodic', category: 'context', memoryType: 'episodic', importance: 0.5, relatedIds: [] });
    (memory as any).store({ key: 's1', value: 'semantic', category: 'fact', memoryType: 'semantic', importance: 0.5, relatedIds: [] });
    const working = memory.listByType('working');
    const episodic = memory.listByType('episodic');
    const semantic = memory.listByType('semantic');
    assert.equal(working.length, 1);
    assert.equal(episodic.length, 1);
    assert.equal(semantic.length, 1);
  });
});

describe('LongTermMemory · Importance Decay', () => {
  it('AC-5 新记忆 importance = 原值', () => {
    const memory = new LongTermMemory({ decayHalfLifeDays: 30 });
    (memory as any).store({ key: 'k', value: 'v', category: 'fact', memoryType: 'semantic', importance: 1.0, relatedIds: [] });
    const e = memory.peek('k');
    assert.ok(e);
    const decayed = memory.getDecayedImportance(e!);
    assert.ok(Math.abs(decayed - 1.0) < 0.01);
  });

  it('AC-6 30 天后 importance 衰减一半', () => {
    const memory = new LongTermMemory({ decayHalfLifeDays: 30 });
    const past = Date.now() - 30 * 24 * 60 * 60 * 1000;
    memory.store({
      key: 'old',
      value: 'v',
      category: 'fact',
      memoryType: 'semantic',
      importance: 1.0,
      relatedIds: [],
      createdAt: past,
    });
    const e = memory.peek('old');
    assert.ok(e);
    const decayed = memory.getDecayedImportance(e!);
    assert.ok(decayed < 0.55 && decayed > 0.45, `decayed 应 ≈ 0.5, 实际 ${decayed}`);
  });
});

describe('LongTermMemory · Consolidation', () => {
  it('AC-7 episodic 不足时 consolidation 不触发', () => {
    const memory = new LongTermMemory();
    (memory as any).store({ key: 'e1', value: 'event1', category: 'fact', memoryType: 'episodic', importance: 0.6, relatedIds: [] });
    const result = memory.consolidate();
    assert.equal(result.merged, 0);
  });

  it('AC-8 episodic 足够 → 合并为 semantic', () => {
    const memory = new LongTermMemory();
    for (let i = 0; i < 6; i++) {
      (memory as any).store({
        key: `ep-${i}`,
        value: `event ${i}`,
        category: 'fact',
        memoryType: 'episodic',
        importance: 0.6,
        relatedIds: [],
      });
    }
    const result = memory.consolidate();
    assert.ok(result.merged > 0);
    const semantic = memory.listByType('semantic');
    assert.ok(semantic.length > 0);
  });

  it('AC-9 consolidation 后 episodic 被删除', () => {
    const memory = new LongTermMemory();
    for (let i = 0; i < 6; i++) {
      (memory as any).store({
        key: `ep-${i}`,
        value: `event ${i}`,
        category: 'fact',
        memoryType: 'episodic',
        importance: 0.6,
        relatedIds: [],
      });
    }
    memory.consolidate();
    const episodic = memory.listByType('episodic');
    assert.equal(episodic.length, 0, '所有 episodic 应被合并删除');
  });
});

describe('LongTermMemory · Prune', () => {
  it('AC-10 prune 删除 importance 太低', () => {
    const memory = new LongTermMemory({ decayHalfLifeDays: 1 });
    const longAgo = Date.now() - 100 * 24 * 60 * 60 * 1000; // 100 days ago
    (memory as any).store({
      key: 'old-low',
      value: 'v',
      category: 'fact',
      memoryType: 'semantic',
      importance: 0.5,
      relatedIds: [],
      createdAt: longAgo,
      ttlMs: 0, // 永不过期 (仅靠 importance 淘汰)
    });
    const removed = memory.prune(0.2);
    assert.ok(removed > 0, `应至少删除 1 条, 实际 ${removed}`);
  });
});
