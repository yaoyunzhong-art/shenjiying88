import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * chaos-engine.test.ts - Phase-22 T79
 * 故障演练引擎单元测试
 */
import assert from 'node:assert/strict';
import { ChaosEngine, CHAOS_PRESETS, latencyMiddleware, exceptionMiddleware, CpuSpikeInjector } from './chaos-engine';

describe('ChaosEngine · start / rollback', () => {
  let engine: ChaosEngine;
  beforeEach(() => {
    engine = new ChaosEngine();
  });
  afterEach(() => {
    engine.rollbackAll();
  });

  it('AC-1 启动故障 → active', () => {
    const exp = engine.start({ type: 'latency', scope: 'global', params: { delayMs: 500 } });
    assert.equal(exp.status, 'active');
    assert.equal(exp.type, 'latency');
    assert.ok(exp.id.startsWith('chaos-'));
    assert.equal(engine.listActive().length, 1);
  });

  it('AC-2 rollback 切换到 rolled-back', () => {
    const exp = engine.start({ type: 'latency', scope: 'global', params: { delayMs: 100 } });
    const rolled = engine.rollback(exp.id);
    assert.equal(rolled?.status, 'rolled-back');
    assert.equal(engine.listActive().length, 0);
    assert.equal(engine.listAll().length, 1);
  });

  it('AC-3 autoRevertMs → 定时完成', async () => {
    const exp = engine.start({ type: 'latency', scope: 'global', params: { delayMs: 100 }, autoRevertMs: 50 });
    assert.equal(exp.status, 'active');
    await new Promise((r) => setTimeout(r, 80));
    const finalExp = engine.get(exp.id);
    assert.equal(finalExp?.status, 'completed');
  });

  it('AC-4 rollback 取消 autoRevert timer', async () => {
    const exp = engine.start({ type: 'latency', scope: 'global', autoRevertMs: 100 });
    engine.rollback(exp.id);
    await new Promise((r) => setTimeout(r, 150));
    const finalExp = engine.get(exp.id);
    assert.equal(finalExp?.status, 'rolled-back', 'rollback 后不应被 autoRevert 改写');
  });

  it('AC-5 rollbackAll 紧急停止所有', () => {
    engine.start({ type: 'latency', scope: 'global', params: { delayMs: 100 } });
    engine.start({ type: 'cpu_spike', scope: 'tenant', params: { cpuPercent: 90 } });
    engine.start({ type: 'memory_leak', scope: 'global', params: { leakBytes: 1024 } });
    assert.equal(engine.listActive().length, 3);
    const count = engine.rollbackAll();
    assert.equal(count, 3);
    assert.equal(engine.listActive().length, 0);
  });
});

describe('ChaosEngine · scope & params', () => {
  let engine: ChaosEngine;
  beforeEach(() => {
    engine = new ChaosEngine();
  });

  it('AC-6 scope = tenant + target 记录', () => {
    const exp = engine.start({
      type: 'partition',
      scope: 'tenant',
      target: 'tenant-A',
      params: { durationMs: 30000 },
      description: 'Test tenant partition',
    });
    assert.equal(exp.scope, 'tenant');
    assert.equal(exp.target, 'tenant-A');
    assert.equal(exp.description, 'Test tenant partition');
  });

  it('AC-7 endsAt 时间戳正确', () => {
    const exp = engine.start({
      type: 'latency',
      scope: 'global',
      autoRevertMs: 60_000,
    });
    assert.ok(exp.endsAt);
    const endsMs = new Date(exp.endsAt!).getTime();
    const startMs = new Date(exp.startedAt).getTime();
    assert.equal(endsMs - startMs, 60_000);
  });

  it('AC-8 recordImpact 影响统计', () => {
    const exp = engine.start({ type: 'latency', scope: 'global' });
    engine.recordImpact(exp.id, { totalRequests: 100, erroredRequests: 5, avgLatencyMs: 350 });
    const after = engine.get(exp.id);
    assert.deepEqual(after?.impact, { totalRequests: 100, erroredRequests: 5, avgLatencyMs: 350 });
  });
});

describe('CHAOS_PRESETS', () => {
  it('AC-9 7 个默认 preset', () => {
    assert.equal(CHAOS_PRESETS.length, 7);
  });

  it('AC-10 每个 preset 有 name/type/defaultParams', () => {
    for (const p of CHAOS_PRESETS) {
      assert.ok(p.name);
      assert.ok(p.type);
      assert.ok(p.defaultParams);
      assert.ok(Object.keys(p.defaultParams).length > 0);
    }
  });

  it('AC-11 cpu_spike preset 包含 cpuPercent', () => {
    const cpu = CHAOS_PRESETS.find((p) => p.type === 'cpu_spike');
    assert.ok(cpu);
    assert.ok('cpuPercent' in cpu!.defaultParams);
  });

  it('AC-12 latency preset 包含 delayMs', () => {
    const lat = CHAOS_PRESETS.find((p) => p.type === 'latency');
    assert.ok(lat);
    assert.ok('delayMs' in lat!.defaultParams);
  });
});

describe('Injectors', () => {
  it('AC-13 latencyMiddleware 调用 next()', () => {
    const mw = latencyMiddleware(10);
    let called = false;
    mw({}, {}, () => { called = true; });
    // 由于 setTimeout, 立即断言不通过,等 20ms
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(called);
        resolve();
      }, 20);
    });
  });

  it('AC-14 latencyMiddleware probability=0 不延迟', () => {
    const mw = latencyMiddleware(1000, 0);
    let called = false;
    mw({}, {}, () => { called = true; });
    assert.ok(called); // 立即调用
  });

  it('AC-15 exceptionMiddleware rate=1 → 500', () => {
    const mw = exceptionMiddleware(1);
    const res = { statusCode: 200, end: (s: string) => { res.body = s; } } as { statusCode: number; end: (s: string) => void; body?: string };
    mw({}, res, () => { res.end('next-called'); });
    assert.equal(res.statusCode, 500);
    assert.equal(res.body, 'chaos-injected-error');
  });

  it('AC-16 CpuSpikeInjector CHAOS_ENABLED=undefined 时禁用', () => {
    const originalEnv = process.env.CHAOS_ENABLED;
    delete process.env.CHAOS_ENABLED;
    const inj = new CpuSpikeInjector();
    const { active } = inj.start(90, 1000);
    assert.equal(active(), false);
    process.env.CHAOS_ENABLED = originalEnv;
  });
});

describe('ChaosEngine · get / list', () => {
  let engine: ChaosEngine;
  beforeEach(() => {
    engine = new ChaosEngine();
  });

  it('AC-17 get 不存在的 id 返回 undefined', () => {
    assert.equal(engine.get('unknown'), undefined);
  });

  it('AC-18 listAll 包含 active + completed', () => {
    const e1 = engine.start({ type: 'latency', scope: 'global' });
    engine.rollback(e1.id);
    engine.start({ type: 'cpu_spike', scope: 'global' });
    const all = engine.listAll();
    assert.equal(all.length, 2);
    assert.ok(all.some((e) => e.status === 'active'));
    assert.ok(all.some((e) => e.status === 'rolled-back'));
  });
});
