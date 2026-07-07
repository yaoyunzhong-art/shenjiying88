import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * error-fingerprint.test.ts - Phase-22 T72
 * Error Fingerprint 单元测试
 */
import assert from 'node:assert/strict';
import {
  computeFingerprint,
  fingerprintToString,
  normalizeStackFrame,
  groupErrors,
  type ErrorEventForGrouping,
} from './error-fingerprint';

function makeError(type: string, message: string, stack = `Error: ${message}\n    at appFn (/app/src/foo.ts:10:5)`): Error {
  const err = new Error(message);
  err.name = type;
  err.stack = stack;
  return err;
}

describe('computeFingerprint', () => {
  it('AC-1 默认 3 parts: [error, type, frame]', () => {
    const err = makeError('TypeError', 'bad');
    const fp = computeFingerprint(err);
    assert.equal(fp.length, 3);
    assert.equal(fp[0], 'error');
    assert.equal(fp[1], 'TypeError');
    assert.match(fp[2], /appFn/);
  });

  it('AC-2 includeMessage 把 message 加入 fingerprint', () => {
    const err = makeError('TypeError', 'bad');
    const fp = computeFingerprint(err, { includeMessage: true });
    assert.equal(fp.length, 4);
    assert.equal(fp[3], 'bad');
  });

  it('AC-3 custom parts 追加', () => {
    const err = makeError('TypeError', 'bad');
    const fp = computeFingerprint(err, { custom: ['tenant:t-A', 'module:cashier'] });
    assert.deepEqual(fp.slice(3), ['tenant:t-A', 'module:cashier']);
  });

  it('AC-4 同 type 同 frame → 同 fingerprint', () => {
    const a = computeFingerprint(makeError('TypeError', 'e1'));
    const b = computeFingerprint(makeError('TypeError', 'e2'));
    assert.equal(fingerprintToString(a), fingerprintToString(b));
  });

  it('AC-5 不同 type → 不同 fingerprint', () => {
    const a = computeFingerprint(makeError('TypeError', 'e'));
    const b = computeFingerprint(makeError('RangeError', 'e'));
    assert.notEqual(fingerprintToString(a), fingerprintToString(b));
  });
});

describe('normalizeStackFrame', () => {
  it('AC-6 移除 macOS 绝对路径', () => {
    const out = normalizeStackFrame('/Users/yao/proj/app/foo.ts');
    assert.equal(out, '/USER/app/foo.ts');
  });

  it('AC-7 移除 Linux home 路径', () => {
    const out = normalizeStackFrame('/home/user/proj/app/foo.ts');
    assert.equal(out, '/HOME/app/foo.ts');
  });

  it('AC-8 UUID 归一化', () => {
    const out = normalizeStackFrame('request id 12345678-1234-1234-1234-123456789abc');
    assert.match(out, /<UUID>/);
    assert.ok(!out.includes('12345678-1234'));
  });

  it('AC-9 时间戳归一化', () => {
    const out = normalizeStackFrame('logged at 1700000000000 ms');
    assert.match(out, /<TIMESTAMP>/);
  });
});

describe('groupErrors', () => {
  it('AC-10 相同 fingerprint 聚合', () => {
    const fp = ['error', 'TypeError', 'appFn (/app/foo.ts)'];
    const events: ErrorEventForGrouping[] = [
      { fingerprint: fp, type: 'TypeError', message: 'e1', timestamp: '2026-06-26T10:00:00Z' },
      { fingerprint: fp, type: 'TypeError', message: 'e2', timestamp: '2026-06-26T11:00:00Z' },
      { fingerprint: fp, type: 'TypeError', message: 'e3', timestamp: '2026-06-26T12:00:00Z' },
    ];
    const groups = groupErrors(events);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].count, 3);
    assert.equal(groups[0].samples.length, 3);
  });

  it('AC-11 不同 fingerprint 不聚合', () => {
    const events: ErrorEventForGrouping[] = [
      { fingerprint: ['error', 'TypeError'], type: 'TypeError', message: 'e', timestamp: '2026-06-26T10:00:00Z' },
      { fingerprint: ['error', 'RangeError'], type: 'RangeError', message: 'e', timestamp: '2026-06-26T10:00:00Z' },
    ];
    const groups = groupErrors(events);
    assert.equal(groups.length, 2);
  });

  it('AC-12 firstSeen / lastSeen 正确', () => {
    const fp = ['error', 'TypeError'];
    const events: ErrorEventForGrouping[] = [
      { fingerprint: fp, type: 'TypeError', message: 'e1', timestamp: '2026-06-26T10:00:00Z' },
      { fingerprint: fp, type: 'TypeError', message: 'e2', timestamp: '2026-06-26T15:00:00Z' },
      { fingerprint: fp, type: 'TypeError', message: 'e3', timestamp: '2026-06-26T12:00:00Z' },
    ];
    const groups = groupErrors(events);
    assert.equal(groups[0].firstSeen, '2026-06-26T10:00:00Z');
    assert.equal(groups[0].lastSeen, '2026-06-26T15:00:00Z');
  });

  it('AC-13 affectedUsers 计算', () => {
    const fp = ['error', 'TypeError'];
    const events: ErrorEventForGrouping[] = [
      { fingerprint: fp, type: 'TypeError', message: 'e', timestamp: 't1', userId: 'u-A' },
      { fingerprint: fp, type: 'TypeError', message: 'e', timestamp: 't2', userId: 'u-A' },
      { fingerprint: fp, type: 'TypeError', message: 'e', timestamp: 't3', userId: 'u-B' },
    ];
    const groups = groupErrors(events);
    assert.equal(groups[0].affectedUsers, 2);
  });

  it('AC-14 samples 最多保留 5 个', () => {
    const fp = ['error', 'TypeError'];
    const events: ErrorEventForGrouping[] = Array.from({ length: 10 }, (_, i) => ({
      fingerprint: fp,
      type: 'TypeError',
      message: `e${i}`,
      timestamp: `2026-06-26T10:00:0${i % 10}Z`,
    }));
    const groups = groupErrors(events);
    assert.equal(groups[0].count, 10);
    assert.equal(groups[0].samples.length, 5);
  });
});
