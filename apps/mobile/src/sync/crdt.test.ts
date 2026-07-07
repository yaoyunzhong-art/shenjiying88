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
});