import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ab-testing.test.ts - Phase-23 T93
 * A/B 测试框架单元测试
 */
import assert from 'node:assert/strict';
import { ExperimentRegistry, hashToBucket, twoProportionZTest, twoSampleTTest } from './ab-testing';

describe('hashToBucket', () => {
  it('AC-1 同 input → 同 bucket', () => {
    const b1 = hashToBucket('user-1', 'exp-1');
    const b2 = hashToBucket('user-1', 'exp-1');
    assert.equal(b1, b2);
  });
  it('AC-2 不同 user → 不同 bucket', () => {
    assert.notEqual(hashToBucket('user-1', 'exp-1'), hashToBucket('user-2', 'exp-1'));
  });
  it('AC-3 bucket 在 [0, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const b = hashToBucket(`u-${i}`, 'e-1');
      assert.ok(b >= 0 && b < 1);
    }
  });
  it('AC-4 分布均匀', () => {
    const buckets: number[] = [];
    for (let i = 0; i < 1000; i++) buckets.push(hashToBucket(`u-${i}`, 'e-1'));
    buckets.sort();
    const median = buckets[500];
    assert.ok(median > 0.4 && median < 0.6, `median ${median} 应 ≈ 0.5`);
  });
});

describe('twoProportionZTest', () => {
  it('AC-5 显著差异 → p < 0.05', () => {
    const result = twoProportionZTest(800, 1000, 500, 1000);
    assert.ok(result.pValue < 0.05, `p 应 < 0.05, 实际 ${result.pValue}`);
  });
  it('AC-6 无差异 → p > 0.05', () => {
    const result = twoProportionZTest(500, 1000, 500, 1000);
    assert.ok(result.pValue > 0.05);
  });
  it('AC-7 0 trial 边界', () => {
    const result = twoProportionZTest(0, 0, 500, 1000);
    assert.equal(result.pValue, 1);
  });
});

describe('twoSampleTTest', () => {
  it('AC-8 显著差异 → p < 0.05', () => {
    const result = twoSampleTTest(10, 1, 100, 5, 1, 100);
    assert.ok(result.pValue < 0.05);
  });
});

describe('ExperimentRegistry · CRUD', () => {
  let registry: ExperimentRegistry;
  beforeEach(() => {
    registry = new ExperimentRegistry();
  });

  it('AC-9 create + get', () => {
    const exp = registry.create({
      id: 'e1',
      name: 'Test Experiment',
      variants: [
        { name: 'control', weight: 0.5, config: { prompt: 'v1' } },
        { name: 'treatment', weight: 0.5, config: { prompt: 'v2' } },
      ],
    });
    assert.equal(exp.status, 'running');
    assert.equal(registry.get('e1')?.name, 'Test Experiment');
  });

  it('AC-10 pause / resume', () => {
    registry.create({
      id: 'e1',
      name: 'Test',
      variants: [{ name: 'a', weight: 1, config: {} }],
    });
    assert.equal(registry.pause('e1'), true);
    assert.equal(registry.get('e1')?.status, 'paused');
    assert.equal(registry.resume('e1'), true);
    assert.equal(registry.get('e1')?.status, 'running');
  });

  it('AC-11 complete 标记 endedAt', () => {
    registry.create({
      id: 'e1',
      name: 'Test',
      variants: [{ name: 'a', weight: 1, config: {} }],
    });
    registry.complete('e1');
    const exp = registry.get('e1');
    assert.equal(exp?.status, 'completed');
    assert.ok(exp?.endedAt);
  });
});

describe('ExperimentRegistry · Assignment', () => {
  let registry: ExperimentRegistry;
  beforeEach(() => {
    registry = new ExperimentRegistry();
    registry.create({
      id: 'e1',
      name: '50/50 Test',
      variants: [
        { name: 'control', weight: 1, config: { v: 'a' } },
        { name: 'treatment', weight: 1, config: { v: 'b' } },
      ],
    });
  });

  it('AC-12 sticky assignment', () => {
    const a1 = registry.assign('e1', 'user-1');
    const a2 = registry.assign('e1', 'user-1');
    assert.equal(a1?.variantName, a2?.variantName);
  });

  it('AC-13 50/50 分配近似均匀', () => {
    let control = 0;
    let treatment = 0;
    for (let i = 0; i < 1000; i++) {
      const a = registry.assign('e1', `user-${i}`);
      if (a?.variantName === 'control') control++;
      else if (a?.variantName === 'treatment') treatment++;
    }
    assert.ok(control > 450 && control < 550, `control=${control}`);
    assert.ok(treatment > 450 && treatment < 550, `treatment=${treatment}`);
  });

  it('AC-14 trafficSplit < 1', () => {
    registry.create({
      id: 'e2',
      name: '20% Test',
      trafficSplit: 0.2,
      variants: [{ name: 'a', weight: 1, config: {} }],
    });
    let assigned = 0;
    for (let i = 0; i < 1000; i++) {
      if (registry.assign('e2', `u-${i}`)) assigned++;
    }
    assert.ok(assigned > 150 && assigned < 250, `assigned=${assigned} 应 ≈ 200`);
  });

  it('AC-15 pause 后不分配', () => {
    registry.pause('e1');
    assert.equal(registry.assign('e1', 'user-1'), undefined);
  });
});

describe('ExperimentRegistry · Report', () => {
  it('AC-16 report 生成 VariantStats', () => {
    const registry = new ExperimentRegistry();
    registry.create({
      id: 'e1',
      name: 'Conversion Test',
      variants: [
        { name: 'control', weight: 1, config: {} },
        { name: 'treatment', weight: 1, config: {} },
      ],
    });
    for (let i = 0; i < 1000; i++) {
      registry.track({ experimentId: 'e1', variantName: 'control', unitId: `u-${i}`, metric: 'conversion', value: i < 200 ? 1 : 0, timestamp: Date.now() });
    }
    for (let i = 0; i < 1000; i++) {
      registry.track({ experimentId: 'e1', variantName: 'treatment', unitId: `u-${i + 1000}`, metric: 'conversion', value: i < 300 ? 1 : 0, timestamp: Date.now() });
    }
    const report = registry.report('e1', 'conversion');
    assert.ok(report);
    assert.equal(report?.variants.length, 2);
    assert.equal(report?.totalEvents, 2000);
    assert.equal(report?.winner, 'treatment');
    assert.ok(report?.significant['treatment'] === true);
  });
});
