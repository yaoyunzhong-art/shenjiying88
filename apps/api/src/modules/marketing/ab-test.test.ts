import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ABTestEngine } from './ab-test'
import { ExperimentAdapter } from './datasources/experiment.adapter'

describe('ABTestEngine', () => {
  let engine: ABTestEngine
  let adapter: ExperimentAdapter

  beforeEach(() => {
    adapter = new ExperimentAdapter()
    engine = new ABTestEngine(adapter)
  })

  function makeExperiment(overrides: Partial<any> = {}) {
    return engine.createExperiment({
      tenantId: 't1',
      campaignId: 'c1',
      name: 'Test Experiment',
      variantA: { id: 'va', name: 'A', content: 'Hi', rewardType: 'COUPON', rewardValue: 1000 },
      variantB: { id: 'vb', name: 'B', content: 'Hello', rewardType: 'DISCOUNT', rewardValue: 10 },
      trafficSplit: 0.5,
      minSampleSize: 1000,
      status: 'RUNNING',
      startAt: new Date().toISOString(),
      ...overrides
    })
  }

  it('hash 一致性: 同一 memberId 总是分到同一 variant', () => {
    const exp = makeExperiment()
    const v1 = engine.assignVariant(exp.id, 'm1')
    const v2 = engine.assignVariant(exp.id, 'm1')
    assert.equal(v1, v2)
  })

  it('hash 50/50: 100 个 member 大致各 50', () => {
    const exp = makeExperiment()
    let a = 0, b = 0
    for (let i = 0; i < 100; i++) {
      const v = engine.assignVariant(exp.id, `m${i}`)
      if (v === 'A') a++; else b++
    }
    // 容忍 ±15
    assert.ok(a >= 35 && a <= 65, `A count ${a} out of range`)
    assert.ok(b >= 35 && b <= 65, `B count ${b} out of range`)
  })

  it('recordImpression 增加 sent 计数', () => {
    const exp = makeExperiment()
    engine.recordImpression(exp.id, 'm1')
    const updated = adapter.queryAny(exp.id)
    assert.equal(updated!.metrics.sentA + updated!.metrics.sentB, 1)
  })

  it('recordClick 增加 clicked 计数', () => {
    const exp = makeExperiment()
    engine.recordClick(exp.id, 'm1')
    const updated = adapter.queryAny(exp.id)
    assert.equal(updated!.metrics.clickedA + updated!.metrics.clickedB, 1)
  })

  it('recordConversion 增加 converted + revenue', () => {
    const exp = makeExperiment()
    engine.recordConversion(exp.id, 'm1', 50000)
    const updated = adapter.queryAny(exp.id)
    const total = updated!.metrics.convertedA + updated!.metrics.convertedB
    const rev = updated!.metrics.revenueCentsA + updated!.metrics.revenueCentsB
    assert.equal(total, 1)
    assert.equal(rev, 50000)
  })

  it('最小样本不足 → INCONCLUSIVE', () => {
    const exp = makeExperiment({ minSampleSize: 100 })
    for (let i = 0; i < 50; i++) {
      engine.recordImpression(exp.id, `m${i}`)
      engine.recordConversion(exp.id, `m${i}`, 100)
    }
    const result = engine.computeResult(exp.id)
    assert.equal(result, 'INCONCLUSIVE')
  })

  it('显著性检验: A 转化率显著高于 B → A 胜', () => {
    const exp = makeExperiment()
    // A: 1500 sent / 300 converted = 20%
    // B: 1500 sent / 150 converted = 10%
    for (let i = 0; i < 1500; i++) {
      const mid = `m-a-${i}`
      engine.assignVariant(exp.id, mid) === 'A'
        ? engine.recordConversion(exp.id, mid, 5000)
        : null
    }
    // 简化: 手动构造 metrics
    const manual = adapter.queryAny(exp.id)!
    manual.metrics.sentA = 1500
    manual.metrics.sentB = 1500
    manual.metrics.convertedA = 300
    manual.metrics.convertedB = 150
    manual.metrics.revenueCentsA = 1500000
    manual.metrics.revenueCentsB = 750000
    adapter.save(manual)

    const result = engine.computeResult(exp.id)
    assert.equal(result, 'A')
  })

  it('显著性检验: 无差异 → INCONCLUSIVE', () => {
    const exp = makeExperiment()
    const manual = adapter.queryAny(exp.id)!
    manual.metrics.sentA = 2000
    manual.metrics.sentB = 2000
    manual.metrics.convertedA = 200
    manual.metrics.convertedB = 200
    adapter.save(manual)

    const result = engine.computeResult(exp.id)
    assert.equal(result, 'INCONCLUSIVE')
  })

  it('canStopEarly 反映 result', () => {
    const exp = makeExperiment()
    const manual = adapter.queryAny(exp.id)!
    manual.metrics.sentA = 1500
    manual.metrics.sentB = 1500
    manual.metrics.convertedA = 300
    manual.metrics.convertedB = 100
    adapter.save(manual)

    const result = engine.computeResult(exp.id)
    assert.equal(result, 'A')
    assert.equal(engine.canStopEarly(exp.id), true)
  })

  it('多租户隔离', () => {
    const exp1 = makeExperiment()
    const exp2 = engine.createExperiment({
      tenantId: 't2',
      campaignId: 'c2',
      name: 'T2',
      variantA: { id: 'va', name: 'A', content: '', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: '', rewardType: 'COUPON', rewardValue: 0 },
      trafficSplit: 0.5,
      minSampleSize: 100,
      status: 'RUNNING',
      startAt: new Date().toISOString()
    })
    const q1 = engine.queryExperiment('t1', exp1.id)
    const q2 = engine.queryExperiment('t2', exp2.id)
    assert.ok(q1)
    assert.ok(q2)
    // T2 看不到 T1 实验
    assert.equal(engine.queryExperiment('t2', exp1.id), null)
  })

  it('listExperiments 列出租户实验', () => {
    makeExperiment()
    makeExperiment({ campaignId: 'c2', name: 'exp2' })
    const list = engine.listExperiments('t1')
    assert.equal(list.length, 2)
  })

  it('countAssignments: 同一 member 多次调用只算一次', () => {
    const exp = makeExperiment()
    engine.assignVariant(exp.id, 'm1')
    engine.assignVariant(exp.id, 'm1')
    engine.assignVariant(exp.id, 'm1')
    const aCount = adapter.countAssignments(exp.id, 'A')
    const bCount = adapter.countAssignments(exp.id, 'B')
    assert.equal(aCount + bCount, 1)
  })

  it('queryByCampaign', () => {
    makeExperiment({ campaignId: 'c1' })
    makeExperiment({ campaignId: 'c1' })
    makeExperiment({ campaignId: 'c2' })
    const list = adapter.queryByCampaign('t1', 'c1')
    assert.equal(list.length, 2)
  })
})