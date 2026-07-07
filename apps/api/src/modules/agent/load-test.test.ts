import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * load-test.test.ts - Phase-23 T95
 * 压测单元测试
 */
import assert from 'node:assert/strict';
import { LoadTester, defaultMockRunner } from './load-test';

describe('LoadTester · 基本', () => {
  it('AC-1 单用户单请求', async () => {
    const tester = new LoadTester();
    const result = await tester.run(defaultMockRunner, {
      concurrency: 1,
      requestsPerUser: 1,
    });
    assert.equal(result.totalRequests, 1);
    assert.equal(result.successful + result.failed, 1);
  });

  it('AC-2 多用户多请求', async () => {
    const tester = new LoadTester();
    const result = await tester.run(defaultMockRunner, {
      concurrency: 5,
      requestsPerUser: 10,
    });
    assert.equal(result.totalRequests, 50);
    assert.equal(result.successful + result.failed, 50);
  });

  it('AC-3 errorRate 在合理范围', async () => {
    const tester = new LoadTester();
    const result = await tester.run(defaultMockRunner, {
      concurrency: 5,
      requestsPerUser: 100,
    });
    // mock 5% 错误率
    assert.ok(result.errorRate < 0.15, `errorRate=${result.errorRate} 应 < 15%`);
    assert.ok(result.errorRate > 0, `errorRate=${result.errorRate} 应 > 0`);
  });
});

describe('LoadTester · Latency', () => {
  it('AC-4 latency percentiles 计算', async () => {
    const tester = new LoadTester();
    const result = await tester.run(defaultMockRunner, {
      concurrency: 5,
      requestsPerUser: 50,
    });
    assert.ok(result.latency.p50 > 0);
    assert.ok(result.latency.p95 >= result.latency.p50);
    assert.ok(result.latency.p99 >= result.latency.p95);
    assert.ok(result.latency.max >= result.latency.p99);
    assert.ok(result.latency.mean > 0);
  });
});

describe('LoadTester · RPS', () => {
  it('AC-5 actualRps > 0', async () => {
    const tester = new LoadTester();
    const result = await tester.run(defaultMockRunner, {
      concurrency: 10,
      requestsPerUser: 20,
    });
    assert.ok(result.actualRps > 0);
  });
});

describe('LoadTester · 超时', () => {
  it('AC-6 request 超时计入失败', async () => {
    const slowRunner = () => new Promise((r) => setTimeout(r, 2000));
    const tester = new LoadTester();
    const result = await tester.run(slowRunner, {
      concurrency: 2,
      requestsPerUser: 3,
      timeoutMs: 100,
    });
    assert.equal(result.successful, 0);
    assert.equal(result.failed, 6);
    assert.equal(result.errorRate, 1);
  });
});

describe('LoadTester · 进度回调', () => {
  it('AC-7 onProgress 触发', async () => {
    const tester = new LoadTester();
    let progressCalls = 0;
    let lastCompleted = 0;
    await tester.run(defaultMockRunner, {
      concurrency: 2,
      requestsPerUser: 5,
      onProgress: (completed, total) => {
        progressCalls++;
        assert.ok(completed > lastCompleted || completed === total);
        lastCompleted = completed;
      },
    });
    assert.equal(progressCalls, 10);
    assert.equal(lastCompleted, 10);
  });
});

describe('LoadTester · RPS limit', () => {
  it('AC-8 targetRps 限制请求速率', async () => {
    const tester = new LoadTester();
    const start = Date.now();
    const result = await tester.run(defaultMockRunner, {
      concurrency: 2,
      requestsPerUser: 5,
      targetRps: 50, // 50 RPS
    });
    const elapsed = Date.now() - start;
    // 10 requests at 50 RPS = 200ms minimum
    assert.ok(elapsed >= 150, `elapsed=${elapsed}ms 应 >= 150ms`);
    assert.ok(result.actualRps <= 100, `actualRps=${result.actualRps} 不应远超目标`);
  });
});
