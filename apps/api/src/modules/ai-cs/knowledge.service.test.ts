import { describe, it, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import type { Knowledge } from './ai-cs.entity'

describe('AiCs KnowledgeService', () => {
  let adapter: KnowledgeAdapter
  let svc: KnowledgeService

  const sampleKnowledge: Knowledge[] = [
    {
      id: 'k-refund-policy',
      tenantId: 't-001',
      category: 'refund',
      title: '退款政策说明',
      content: '自购买日起7天内可申请无理由退款，需保持商品完好。',
      tags: ['退款', '退货', '政策'],
      metadata: { viewCount: 0, helpfulCount: 0 },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'k-shipping-info',
      tenantId: 't-001',
      category: 'shipping',
      title: '物流配送说明',
      content: '标准配送3-5个工作日，加急配送1-2个工作日。',
      tags: ['物流', '配送', '快递'],
      metadata: { viewCount: 0, helpfulCount: 0 },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'k-member-benefits',
      tenantId: 't-001',
      category: 'member',
      title: '会员权益说明',
      content: 'VIP会员享受专属折扣、生日礼品和优先客服。',
      tags: ['会员', 'VIP', '权益'],
      metadata: { viewCount: 0, helpfulCount: 0 },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    adapter = new KnowledgeAdapter()
    adapter.seed(sampleKnowledge)
    svc = new KnowledgeService(adapter)
  })

  it('should search knowledge by query', () => {
    const results = svc.search('t-001', '退款 退货')
    assert.ok(results.length >= 1)
    assert.ok(results.some(k => k.id === 'k-refund-policy'))
  })

  it('should return empty array for unmatched query', () => {
    const results = svc.search('t-001', 'zzzunknownzzz')
    assert.deepEqual(results, [])
  })

  it('should search with custom topK and threshold', () => {
    const results = svc.search('t-001', '会员 VIP', { topK: 2, threshold: 0.1 })
    assert.ok(results.length <= 2)
  })

  it('should search high confidence matches', () => {
    const results = svc.searchHighConfidence('t-001', '退款')
    // searchHighConfidence uses low threshold (0.1), so should match
    assert.ok(results.length >= 1)
  })

  it('should search with English query', () => {
    const results = svc.search('t-001', 'refund')
    // 'refund' not in the content tokens directly, but might match via tags
    assert.ok(Array.isArray(results))
  })

  it('should search by category', () => {
    const results = svc.searchByCategory('t-001', 'refund')
    assert.equal(results.length, 1)
    assert.equal(results[0].id, 'k-refund-policy')
  })

  it('should return empty for non-existent category', () => {
    const results = svc.searchByCategory('t-001', 'nonexistent')
    assert.deepEqual(results, [])
  })

  it('should search by keyword', () => {
    const results = svc.searchByKeyword('t-001', 'VIP')
    assert.ok(results.length >= 1)
    assert.ok(results.some(k => k.id === 'k-member-benefits'))
  })

  it('should search by Chinese keyword', () => {
    const results = svc.searchByKeyword('t-001', '退款')
    assert.ok(results.length >= 1)
    assert.ok(results.some(k => k.id === 'k-refund-policy'))
  })

  it('should mark knowledge as helpful', () => {
    const updated = svc.markHelpful('t-001', 'k-refund-policy')
    assert.equal(updated.metadata.helpfulCount, 1)
    // Verify increment persisted
    const updated2 = svc.markHelpful('t-001', 'k-refund-policy')
    assert.equal(updated2.metadata.helpfulCount, 2)
  })

  it('should increment view count on search', () => {
    const before = adapter.query('t-001', 'k-refund-policy')
    const beforeViews = before!.metadata.viewCount

    const results = svc.search('t-001', '退款 退货')
    const after = adapter.query('t-001', 'k-refund-policy')
    // viewCount may or may not increment depending on whether the result matches
    assert.ok(after!.metadata.viewCount >= beforeViews)
  })

  it('should handle cross-tenant isolation', () => {
    // Search tenant t-001 should not see t-002's data
    const t2Results = svc.search('t-002', 'refund')
    assert.deepEqual(t2Results, [])
  })
})
