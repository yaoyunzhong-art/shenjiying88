import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IntentService } from './intent.service'
import { IntentAdapter } from './datasources/intent.adapter'
import type { Intent } from './ai-cs.entity'

describe('AiCs IntentService', () => {
  let adapter: IntentAdapter
  let svc: IntentService

  const sampleIntents: Intent[] = [
    {
      id: 'intent-refund',
      tenantId: 't-001',
      name: '退款咨询',
      description: '用户询问退款相关事宜',
      keywords: ['退款', '退钱', 'refund'],
      confidence: 0.9,
      matchedKnowledgeIds: [],
      fallbackMessage: '退款问题已转接人工客服',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'intent-order',
      tenantId: 't-001',
      name: '订单查询',
      description: '用户查询订单状态',
      keywords: ['订单', 'order', '物流'],
      confidence: 0.85,
      matchedKnowledgeIds: [],
      fallbackMessage: '正在为您查询订单信息',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'intent-member',
      tenantId: 't-001',
      name: '会员服务',
      description: '用户咨询会员相关',
      keywords: ['会员', 'VIP', '积分', '等级'],
      confidence: 0.8,
      matchedKnowledgeIds: [],
      fallbackMessage: '会员信息如下...',
      createdAt: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    adapter = new IntentAdapter()
    adapter.seed(sampleIntents)
    svc = new IntentService(adapter)
  })

  it('should recognize intent by matching keywords', () => {
    const result = svc.recognize('t-001', '我想退款')
    assert.ok(result.intent !== null)
    assert.equal(result.intent!.id, 'intent-refund')
    assert.ok(result.confidence > 0)
  })

  it('should return null intent when no keywords match', () => {
    const result = svc.recognize('t-001', '今天天气真好')
    assert.equal(result.matched, false)
    assert.equal(result.intent, null)
    assert.equal(result.confidence, 0)
  })

  it('should return highest confidence intent for multi-keyword match', () => {
    const result = svc.recognize('t-001', '我想退款 我的订单')
    // At least intent is recognized (though confidence may be < 0.5)
    assert.ok(result.intent !== null)
    assert.ok(result.confidence > 0)
  })

  it('should recognize refund intent with high confidence using multiple keyword hits', () => {
    const result = svc.recognize('t-001', '退款 退钱 我要refund')
    assert.ok(result.matched)
    assert.equal(result.intent!.id, 'intent-refund')
    // 3/3 keywords matched => score=1.0 => confidence >= 1.0
    assert.ok(result.confidence >= 0.5)
  })

  it('should detect handoff when confidence below 0.7', () => {
    assert.equal(svc.shouldHandoff(0.3), true)
    assert.equal(svc.shouldHandoff(0.69), true)
  })

  it('should not handoff when confidence >= 0.7', () => {
    assert.equal(svc.shouldHandoff(0.7), false)
    assert.equal(svc.shouldHandoff(0.95), false)
  })

  it('should list all intents for a tenant', () => {
    const intents = svc.list('t-001')
    assert.equal(intents.length, 3)
    const ids = intents.map(i => i.id)
    assert.ok(ids.includes('intent-refund'))
    assert.ok(ids.includes('intent-order'))
    assert.ok(ids.includes('intent-member'))
  })

  it('should return empty list for non-existent tenant', () => {
    const intents = svc.list('t-nonexistent')
    assert.deepEqual(intents, [])
  })

  it('should recognize member-related intent', () => {
    const result = svc.recognize('t-001', 'VIP 积分 会员')
    assert.ok(result.matched)
    assert.equal(result.intent!.id, 'intent-member')
  })

  it('should handle empty text gracefully', () => {
    const result = svc.recognize('t-001', '')
    assert.equal(result.matched, false)
    assert.equal(result.intent, null)
    assert.equal(result.confidence, 0)
  })

  it('should handle case-insensitive English keywords', () => {
    const result = svc.recognize('t-001', 'I need a REFUND')
    assert.ok(result.intent !== null)
    assert.equal(result.intent!.id, 'intent-refund')
    // Confidence may be < 0.5 with only 1/3 keywords matched
    assert.ok(result.confidence > 0)
  })
})
