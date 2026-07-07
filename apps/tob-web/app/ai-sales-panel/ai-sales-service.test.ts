import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getRecommendations,
  getUpsellRecommendations,
  getCrossSellRecommendations,
  handleObjection,
  getFollowUps,
  completeFollowUp,
  getSalesScript,
} from './ai-sales-service'
import { MOCK_RECOMMENDATIONS, MOCK_FOLLOW_UPS, MOCK_SCRIPTS } from './ai-sales-data'

describe('ai-sales-service', () => {
  describe('getRecommendations', () => {
    it('returns the full mock list (no filtering)', async () => {
      const list = await getRecommendations('C001')
      assert.equal(list.length, MOCK_RECOMMENDATIONS.length)
    })

    it('returns items in their mock order', async () => {
      const list = await getRecommendations('C001')
      assert.equal(list[0].id, MOCK_RECOMMENDATIONS[0].id)
    })
  })

  describe('getUpsellRecommendations', () => {
    it('returns only matchScore > 85 items', async () => {
      const list = await getUpsellRecommendations('P001')
      for (const item of list) {
        assert.ok(item.matchScore > 85, `expected matchScore > 85, got ${item.matchScore}`)
      }
    })

    it('limits to at most 3 results', async () => {
      const list = await getUpsellRecommendations('P001')
      assert.ok(list.length <= 3, `expected <=3, got ${list.length}`)
    })
  })

  describe('getCrossSellRecommendations', () => {
    it('returns only items in 70 < matchScore <= 85 band', async () => {
      const list = await getCrossSellRecommendations('P001')
      for (const item of list) {
        assert.ok(item.matchScore <= 85, `expected <=85, got ${item.matchScore}`)
        assert.ok(item.matchScore > 70, `expected >70, got ${item.matchScore}`)
      }
    })

    it('limits to at most 3 results', async () => {
      const list = await getCrossSellRecommendations('P001')
      assert.ok(list.length <= 3)
    })

    it('disjoint from upsell band (matchScore > 85 is exclusive)', async () => {
      const upsell = await getUpsellRecommendations('P001')
      const crosssell = await getCrossSellRecommendations('P001')
      const upsellIds = new Set(upsell.map(p => p.id))
      for (const p of crosssell) {
        assert.ok(!upsellIds.has(p.id), `${p.id} appeared in both lists`)
      }
    })
  })

  describe('handleObjection', () => {
    it('returns response and suggestedQuestions for known type', async () => {
      const result = await handleObjection('price', { productId: 'P001' })
      assert.ok(result.response.length > 0)
      assert.equal(result.suggestedQuestions.length, 3)
      assert.ok(result.suggestedQuestions[0].includes('便宜'))
    })

    it('returns fallback response for unknown type', async () => {
      const result = await handleObjection('unknown' as never, {})
      assert.equal(result.response, '抱歉，暂未找到相关应对话术，请联系管理人员。')
      assert.equal(result.suggestedQuestions.length, 0)
    })

    it('includes the original customer question as first suggested question', async () => {
      const result = await handleObjection('quality', {})
      assert.ok(result.suggestedQuestions[0].includes('质量'))
    })
  })

  describe('getFollowUps', () => {
    it('returns the full mock list', async () => {
      const list = await getFollowUps('S001')
      assert.equal(list.length, MOCK_FOLLOW_UPS.length)
    })
  })

  describe('completeFollowUp', () => {
    it('returns updated task with status=completed for known id', async () => {
      const updated = await completeFollowUp('FU001')
      assert.ok(updated)
      assert.equal(updated!.id, 'FU001')
      assert.equal(updated!.status, 'completed')
    })

    it('returns null for unknown id', async () => {
      const updated = await completeFollowUp('NONEXISTENT')
      assert.equal(updated, null)
    })

    it('preserves all other fields (does not mutate input)', async () => {
      const updated = await completeFollowUp('FU001')
      assert.equal(updated!.customerName, MOCK_FOLLOW_UPS.find(t => t.id === 'FU001')!.customerName)
      assert.equal(updated!.content, MOCK_FOLLOW_UPS.find(t => t.id === 'FU001')!.content)
    })
  })

  describe('getSalesScript', () => {
    it('returns matching script for product + tone', async () => {
      const script = await getSalesScript('P001', 'friendly')
      assert.ok(script)
      assert.equal(script!.productId, 'P001')
      assert.equal(script!.tone, 'friendly')
    })

    it('returns null for unknown product', async () => {
      const script = await getSalesScript('UNKNOWN', 'friendly')
      assert.equal(script, null)
    })

    it('falls back to any script for the product when tone does not match', async () => {
      // P001 has both friendly and professional, urgent not present
      const script = await getSalesScript('P001', 'urgent')
      assert.ok(script, 'expected fallback to any P001 script')
      assert.equal(script!.productId, 'P001')
    })
  })

  describe('MOCK_SCRIPTS sanity', () => {
    it('covers all 3 tones for the test products', () => {
      // ensure tests above are not vacuous
      const tones = new Set(MOCK_SCRIPTS.map(s => s.tone))
      assert.ok(tones.has('friendly'))
      assert.ok(tones.has('professional'))
      assert.ok(tones.has('urgent'))
    })
  })
})
