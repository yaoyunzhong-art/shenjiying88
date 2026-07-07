import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * sampler.test.ts - Phase-22 T68
 * Trace 采样策略单元测试
 */
import assert from 'node:assert/strict';
import {
  ProbabilitySampler,
  ErrorFirstSampler,
  TailBasedSampler,
  createSampler,
  createTailSampler,
  TAIL_SAMPLING_CONFIG,
} from './sampler';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';

// ── Mock helpers ──

function makeSpan(opts: {
  name?: string;
  durationMs?: number;
  statusCode?: number; // 1=OK, 2=ERROR
  httpStatusCode?: number;
}): ReadableSpan {
  const durationMs = opts.durationMs ?? 100;
  return {
    name: opts.name ?? 'test.span',
    duration: [Math.floor(durationMs / 1000), (durationMs % 1000) * 1_000_000],
    status: { code: opts.statusCode ?? 1 },
    attributes: opts.httpStatusCode !== undefined ? { 'http.status_code': opts.httpStatusCode } : {},
    // 其他字段对测试不重要,留空
  } as unknown as ReadableSpan;
}

// ── Probability Sampler ──

describe('ProbabilitySampler', () => {
  it('probability=1: 全部 RECORD_AND_SAMPLED', () => {
    const s = new ProbabilitySampler(1);
    for (let i = 0; i < 100; i++) {
      const r = s.shouldSample({} as never);
      assert.equal(r.decision, 2 /* RECORD_AND_SAMPLED */);
    }
  });

  it('probability=0: 全部 NOT_RECORD', () => {
    const s = new ProbabilitySampler(0);
    for (let i = 0; i < 100; i++) {
      const r = s.shouldSample({} as never);
      assert.equal(r.decision, 0 /* NOT_RECORD */);
    }
  });

  it('probability=0.5: 约 50% 采样', () => {
    const s = new ProbabilitySampler(0.5);
    let sampled = 0;
    const total = 10000;
    for (let i = 0; i < total; i++) {
      const r = s.shouldSample({} as never);
      if (r.decision === 2 /* RECORD_AND_SAMPLED */) sampled++;
    }
    const ratio = sampled / total;
    assert.ok(ratio > 0.45 && ratio < 0.55, `期望 ~50%,实际 ${(ratio * 100).toFixed(1)}%`);
  });

  it('无效 probability 抛错', () => {
    assert.throws(() => new ProbabilitySampler(-0.1), /probability/);
    assert.throws(() => new ProbabilitySampler(1.5), /probability/);
  });
});

// ── ErrorFirstSampler ──

describe('ErrorFirstSampler', () => {
  it('始终按概率采样 (错误由 tail-based 决定)', () => {
    const s = new ErrorFirstSampler(0.5);
    const r = s.shouldSample({} as never);
    assert.ok([0, 2].includes(r.decision)); // NOT_RECORD 或 RECORD_AND_SAMPLED
  });

  it('toString 包含 probability', () => {
    const s = new ErrorFirstSampler(0.1);
    assert.match(s.toString(), /ErrorFirstSampler/);
  });
});

// ── Tail-Based Sampler ──

describe('TailBasedSampler', () => {
  it('错误 span (status=ERROR) 100% 保留', () => {
    const sampler = new TailBasedSampler(TAIL_SAMPLING_CONFIG);
    const errSpan = makeSpan({ statusCode: 2 });
    const decision = sampler.shouldKeep(errSpan);
    assert.equal(decision.sampled, true);
    assert.equal(decision.reason, 'error');
  });

  it('HTTP 5xx 100% 保留', () => {
    const sampler = new TailBasedSampler(TAIL_SAMPLING_CONFIG);
    const errSpan = makeSpan({ httpStatusCode: 503 });
    const decision = sampler.shouldKeep(errSpan);
    assert.equal(decision.sampled, true);
    assert.equal(decision.reason, 'error');
  });

  it('慢请求 (duration > 阈值) 100% 保留', () => {
    const sampler = new TailBasedSampler({ slowThresholdMs: 500, captureErrors: true, normalProbability: 0 });
    const slowSpan = makeSpan({ durationMs: 1500 });
    const decision = sampler.shouldKeep(slowSpan);
    assert.equal(decision.sampled, true);
    assert.equal(decision.reason, 'slow');
  });

  it('正常请求按概率 (probability=0)', () => {
    const sampler = new TailBasedSampler({ slowThresholdMs: 1000, captureErrors: true, normalProbability: 0 });
    const okSpan = makeSpan({ durationMs: 100 });
    const decision = sampler.shouldKeep(okSpan);
    assert.equal(decision.sampled, false);
  });

  it('filterBatch 分类统计', () => {
    const sampler = new TailBasedSampler({ slowThresholdMs: 1000, captureErrors: true, normalProbability: 1 });
    const spans = [
      makeSpan({ statusCode: 2 }), // error
      makeSpan({ durationMs: 1500 }), // slow
      makeSpan({ durationMs: 100 }), // normal + probability=1
    ];
    const { kept, dropped } = sampler.filterBatch(spans);
    assert.equal(kept.length, 3);
    assert.equal(dropped, 0);
  });
});

// ── Factory ──

describe('createSampler / createTailSampler', () => {
  it('createSampler 默认 probability=0.1', () => {
    const s = createSampler();
    assert.match(s.toString(), /ProbabilitySampler\{probability=0\.1\}/);
  });

  it('createSampler({ probability: 0.5, tail: true })', () => {
    const s = createSampler({ probability: 0.5, tail: true });
    assert.match(s.toString(), /probability=0\.5/);
  });

  it('createTailSampler 默认配置', () => {
    const s = createTailSampler();
    const decision = s.shouldKeep(makeSpan({ durationMs: 100 }));
    assert.equal(decision.reason, 'normal');
  });

  it('createTailSampler 自定义 slowThreshold', () => {
    const s = createTailSampler({ slowThresholdMs: 50, captureErrors: false, normalProbability: 0 });
    const decision = s.shouldKeep(makeSpan({ durationMs: 100 }));
    assert.equal(decision.sampled, true);
    assert.equal(decision.reason, 'slow');
  });
});
