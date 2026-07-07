import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { AttributionEngine } from './attribution'
import type { TouchPoint } from './marketing.entity'

describe('AttributionEngine', () => {
  let engine: AttributionEngine

  const NOW = new Date('2025-06-15T00:00:00Z').getTime()

  beforeEach(() => {
    engine = new AttributionEngine()
  })

  it('空触点 → 空 attribution', () => {
    const r = engine.attributeLastNonDirect('m1', 'c1', 10000)
    assert.equal(r.lastNonDirectTouch, undefined)
    assert.equal(r.attributedCampaignId, undefined)
  })

  it('V1: Last non-direct touch 归因', () => {
    engine.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'c1', channel: 'IN_APP', event: 'IMPRESSION', timestamp: new Date(NOW - 5 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', campaignId: 'c2', channel: 'SMS', event: 'CLICK', timestamp: new Date(NOW - 3 * 86400000).toISOString() },
      { id: 'tp3', memberId: 'm1', campaignId: 'c3', channel: 'WECHAT', event: 'CLICK', timestamp: new Date(NOW - 1 * 86400000).toISOString() },
      { id: 'tp4', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = engine.attributeLastNonDirect('m1', 'tp4', 50000)
    // 应该是 tp3 (WECHAT) 而非 tp4 (DIRECT)
    assert.equal(r.lastNonDirectTouch?.id, 'tp3')
    assert.equal(r.attributedCampaignId, 'c3')
    assert.equal(r.attributedChannel, 'WECHAT')
  })

  it('V1: 7 天归因窗口外不归因', () => {
    engine.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'c1', channel: 'IN_APP', event: 'CLICK', timestamp: new Date(NOW - 30 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = engine.attributeLastNonDirect('m1', 'tp2', 50000)
    // tp1 超出 7 天窗口 → 无归因
    assert.equal(r.lastNonDirectTouch, undefined)
  })

  it('V1: ORGANIC 触点被忽略', () => {
    engine.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'c1', channel: 'ORGANIC', event: 'CLICK', timestamp: new Date(NOW - 3 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = engine.attributeLastNonDirect('m1', 'tp2', 50000)
    assert.equal(r.lastNonDirectTouch, undefined)
  })

  it('V2: 多触点归因 40/40/20', () => {
    engine.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'first', channel: 'IN_APP', event: 'CLICK', timestamp: new Date(NOW - 5 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', campaignId: 'mid1', channel: 'WECHAT', event: 'CLICK', timestamp: new Date(NOW - 3 * 86400000).toISOString() },
      { id: 'tp3', memberId: 'm1', campaignId: 'mid2', channel: 'SMS', event: 'CLICK', timestamp: new Date(NOW - 2 * 86400000).toISOString() },
      { id: 'tp4', memberId: 'm1', campaignId: 'last', channel: 'WECHAT', event: 'CLICK', timestamp: new Date(NOW - 1 * 86400000).toISOString() },
      { id: 'tp5', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = engine.attributeMultiTouch('m1', 'tp5', 50000)
    const weights = r.attributionWeights || {}
    // first=0.4, last=0.4, mid1+mid2 平均 0.1 each
    assert.equal(weights['first'], 0.4)
    assert.equal(weights['last'], 0.4)
    assert.ok(weights['mid1']! > 0)
    assert.ok(weights['mid2']! > 0)
  })

  it('V2: 仅 1 触点 → 100% 归因', () => {
    engine.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', campaignId: 'c1', channel: 'IN_APP', event: 'CLICK', timestamp: new Date(NOW - 1 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', channel: 'DIRECT', event: 'CONVERSION', timestamp: new Date(NOW).toISOString(), revenueCents: 50000 }
    ])
    const r = engine.attributeMultiTouch('m1', 'tp2', 50000)
    assert.deepEqual(r.attributionWeights, { c1: 1 })
  })

  it('recordTouchPoint 自动生成 ID', () => {
    const tp = engine.recordTouchPoint({
      id: '', memberId: 'm1', channel: 'IN_APP', event: 'IMPRESSION',
      timestamp: new Date().toISOString()
    })
    assert.ok(tp.id.length > 0)
    assert.match(tp.id, /^tp-/)
  })

  it('queryByMember 按时间倒序', () => {
    engine.seedTouchPoints([
      { id: 'tp1', memberId: 'm1', channel: 'IN_APP', event: 'IMPRESSION', timestamp: new Date(NOW - 5 * 86400000).toISOString() },
      { id: 'tp2', memberId: 'm1', channel: 'IN_APP', event: 'IMPRESSION', timestamp: new Date(NOW - 1 * 86400000).toISOString() },
      { id: 'tp3', memberId: 'm2', channel: 'IN_APP', event: 'IMPRESSION', timestamp: new Date(NOW).toISOString() }
    ])
    const m1Points = engine.queryByMember('m1')
    assert.equal(m1Points.length, 2)
    assert.equal(m1Points[0].id, 'tp2')  // 最近
    assert.equal(m1Points[1].id, 'tp1')
  })

  it('ATTRIBUTION_WINDOW_DAYS = 7', () => {
    assert.equal(AttributionEngine.WINDOW_DAYS, 7)
  })
})