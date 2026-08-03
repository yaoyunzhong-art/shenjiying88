/**
 * crdt.test.ts - Phase-21 T57
 * CRDT 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CRDTStore } from './crdt';

describe('CRDTStore · Phase-21 T57', () => {
  let store: CRDTStore;

  beforeEach(() => {
    store = new CRDTStore();
  });

  // AC-1: 基本 set/get
  it('AC-1 setField: basic set + get', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    expect(store.getField('doc1', 'name')).toBe('Alice');
    expect(store.getDoc('doc1')?.fields.name.timestamp).toBe(100);
  });

  // AC-2: 旧时间戳不覆盖
  it('AC-2 LWW: older timestamp does not overwrite', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc1', 'name', 'Bob', 'device-B', 50); // 更旧
    expect(store.getField('doc1', 'name')).toBe('Alice');
  });

  // AC-3: 新时间戳覆盖
  it('AC-3 LWW: newer timestamp wins', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc1', 'name', 'Bob', 'device-B', 200);
    expect(store.getField('doc1', 'name')).toBe('Bob');
  });

  // AC-4: 同时间戳冲突 - 确定性胜出
  it('AC-4 same timestamp: deterministic by deviceId lex order', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc1', 'name', 'Bob', 'device-B', 100);
    // 'device-B' > 'device-A' 字典序胜出
    expect(store.getField('doc1', 'name')).toBe('Bob');
  });

  // AC-5: 远程合并 - 不同字段
  it('AC-5 merge: combine fields from both sides', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const remote = {
      id: 'doc1',
      fields: {
        age: { value: 30, timestamp: 100, deviceId: 'device-B' },
      },
      clock: { 'device-B': 100 },
      updatedAt: 100,
    };
    const result = store.mergeRemote(remote);
    expect(result.fieldsAdded).toBe(1);
    expect(store.getField('doc1', 'name')).toBe('Alice');
    expect(store.getField('doc1', 'age')).toBe(30);
  });

  // AC-6: 远程合并 - 冲突解决
  it('AC-6 merge: resolve conflicts via LWW', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const remote = {
      id: 'doc1',
      fields: {
        name: { value: 'Bob', timestamp: 200, deviceId: 'device-B' },
      },
      clock: { 'device-B': 200 },
      updatedAt: 200,
    };
    const result = store.mergeRemote(remote);
    expect(result.conflictsResolved).toBe(1);
    expect(store.getField('doc1', 'name')).toBe('Bob');
  });

  // AC-7: 向量时钟比较
  it('AC-7 compareClocks: before/after/concurrent', () => {
    const a = { 'dev-A': 100, 'dev-B': 50 };
    const b = { 'dev-A': 80, 'dev-B': 50 };
    expect(store.compareClocks(a, b)).toBe('after');

    const c = { 'dev-A': 80, 'dev-B': 50 };
    const d = { 'dev-A': 100, 'dev-B': 50 };
    expect(store.compareClocks(c, d)).toBe('before');

    const e = { 'dev-A': 100, 'dev-B': 50 };
    const f = { 'dev-A': 80, 'dev-B': 80 };
    expect(store.compareClocks(e, f)).toBe('concurrent');
  });

  // ── 新增: LWW 边界条件 ──

  it('LWW: 新字段写入同时间戳但 deviceId 更小, 不覆盖', () => {
    store.setField('doc1', 'name', 'Alice', 'device-Z', 100);
    store.setField('doc1', 'name', 'Bob', 'device-A', 100); // device-A < device-Z
    // device-A < device-Z, 所以设备A不赢
    // 但条件: !existing || existing.timestamp < timestamp || (existing.timestamp === timestamp && deviceId > existing.deviceId)
    // device-A > device-Z? No. So Alice (Z) stays.
    expect(store.getField('doc1', 'name')).toBe('Alice');
  });

  it('LWW: 同时间戳 deviceId 更大的胜出', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc1', 'name', 'Bob', 'device-M', 100);
    // device-M > device-A → Bob wins
    expect(store.getField('doc1', 'name')).toBe('Bob');
  });

  it('LWW: 不同字段独立处理', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc1', 'age', 25, 'device-B', 200);
    store.setField('doc1', 'city', 'Shanghai', 'device-C', 150);
    expect(store.getField('doc1', 'name')).toBe('Alice');
    expect(store.getField('doc1', 'age')).toBe(25);
    expect(store.getField('doc1', 'city')).toBe('Shanghai');
  });

  // ── 新增: 远程合并边界 ──

  it('mergeRemote: 空远端文档不会报错', () => {
    const result = store.mergeRemote({
      id: 'doc-new',
      fields: {},
      clock: { 'remote-A': 100 },
      updatedAt: 100,
    });
    expect(result.fieldsAdded).toBe(0);
    expect(result.conflictsResolved).toBe(0);
    expect(store.getDoc('doc-new')).toBeDefined();
  });

  it('mergeRemote: 相同时间戳同 deviceId, 本地不覆盖', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const remote = {
      id: 'doc1',
      fields: {
        name: { value: 'Bob', timestamp: 100, deviceId: 'device-A' },
      },
      clock: { 'device-A': 100 },
      updatedAt: 100,
    };
    const result = store.mergeRemote(remote);
    // 同时间戳同设备: 不满足覆盖条件 (deviceId 不大于自身)
    expect(result.conflictsResolved).toBe(0);
    expect(store.getField('doc1', 'name')).toBe('Alice');
  });

  it('mergeRemote: 相同时间戳不同 deviceId 冲突解决', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const remote = {
      id: 'doc1',
      fields: {
        name: { value: 'Bob', timestamp: 100, deviceId: 'device-B' },
      },
      clock: { 'device-B': 100 },
      updatedAt: 100,
    };
    const result = store.mergeRemote(remote);
    // device-B > device-A → Bob wins (conflict resolved)
    expect(result.conflictsResolved).toBe(1);
    expect(store.getField('doc1', 'name')).toBe('Bob');
  });

  it('mergeRemote: 远端字段旧于本地, 不覆盖', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 200);
    const remote = {
      id: 'doc1',
      fields: {
        name: { value: 'Bob', timestamp: 100, deviceId: 'device-B' },
      },
      clock: { 'device-B': 100 },
      updatedAt: 100,
    };
    const result = store.mergeRemote(remote);
    expect(result.conflictsResolved).toBe(0);
    expect(store.getField('doc1', 'name')).toBe('Alice');
  });

  // ── 新增: getDoc 安全 ──

  it('getDoc: 不存在的文档返回 undefined', () => {
    expect(store.getDoc('non-existent')).toBeUndefined();
  });

  it('getDoc: 返回的 fields 是浅拷贝对象', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const snapshot = store.getDoc('doc1')!;
    // fields 和 clock 是 {...doc.fields, ...doc.clock} 的浅拷贝
    // 但 LWWValue 对象本身是引用
    expect(snapshot.fields.name.value).toBe('Alice');
    expect(snapshot.clock['device-A']).toBe(100);

    // 尝试添加新字段不影响原文档
    snapshot.fields.extra = { value: 'test', timestamp: 999, deviceId: 'dev-X' };
    expect(store.getField('doc1', 'extra')).toBeUndefined();
  });

  // ── 新增: 向量时钟进阶 ──

  it('compareClocks: 两个空时钟为 concurrent', () => {
    expect(store.compareClocks({}, {})).toBe('concurrent');
  });

  it('compareClocks: 有设备出现旧时钟中没有的键', () => {
    const a = { 'dev-A': 100 };
    const b = { 'dev-A': 50, 'dev-B': 10 };
    // dev-A: 100>50 ∧ dev-B: 0<10 → both greater → concurrent
    expect(store.compareClocks(a, b)).toBe('concurrent');
  });

  it('compareClocks: 所有设备时钟相等为 concurrent', () => {
    const a = { 'dev-A': 100, 'dev-B': 50 };
    const b = { 'dev-A': 100, 'dev-B': 50 };
    expect(store.compareClocks(a, b)).toBe('concurrent');
  });

  // ── 新增: 多文档场景 ──

  it('多文档: 不同 docId 互不影响', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc2', 'name', 'Bob', 'device-B', 100);
    expect(store.getField('doc1', 'name')).toBe('Alice');
    expect(store.getField('doc2', 'name')).toBe('Bob');
  });

  it('多文档: 各文档有独立的 clock', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    store.setField('doc2', 'city', 'Beijing', 'device-B', 200);
    const doc1 = store.getDoc('doc1')!;
    const doc2 = store.getDoc('doc2')!;
    expect(doc1.clock['device-A']).toBe(100);
    expect(doc1.clock['device-B'] ?? 0).toBe(0);
    expect(doc2.clock['device-B']).toBe(200);
  });

  // ── 新增: mergeRemote 更新向量时钟 ──

  it('mergeRemote: 向量时钟取最大值合并', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const remote = {
      id: 'doc1',
      fields: {
        age: { value: 30, timestamp: 200, deviceId: 'device-B' },
      },
      clock: { 'device-A': 50, 'device-B': 200 },
      updatedAt: 200,
    };
    store.mergeRemote(remote);
    const doc = store.getDoc('doc1')!;
    // device-A: max(100, 50) = 100
    // device-B: max(0, 200) = 200
    expect(doc.clock['device-A']).toBe(100);
    expect(doc.clock['device-B']).toBe(200);
  });

  it('mergeRemote: updatedAt 取最大值', () => {
    store.setField('doc1', 'name', 'Alice', 'device-A', 100);
    const remote = {
      id: 'doc1',
      fields: {
        age: { value: 30, timestamp: 200, deviceId: 'device-B' },
      },
      clock: { 'device-B': 200 },
      updatedAt: 200,
    };
    store.mergeRemote(remote);
    expect(store.getDoc('doc1')!.updatedAt).toBe(200);
  });
});
