/**
 * d3.service.test.ts — D3 智能推荐引擎单元测试
 *
 * 覆盖 D3Service 全部三个领域（Discovery + Decision + Delivery）的核心方法。
 *
 * 测试项：14 项（含正例 + 反例 + 边界）
 *  - Discovery:
 *    1. getRecommendations — 有用户画像时返回匹配推荐（正例）
 *    2. getRecommendations — 不存在用户返回默认推荐（反例）
 *    3. getRecommendations — limit=0 时返回至少 1 项（边界）
 *    4. getTrendingItems — 按类型获取热门（正例）
 *    5. getTrendingItems — 空类型返回空（反例/边界）
 *    6. getPersonalPicks — 有画像返回个性化选品（正例）
 *    7. getPersonalPicks — 无画像返回默认选品（反例）
 *  - Decision:
 *    8. applyFilters — 分类过滤（正例）
 *    9. applyFilters — 价格区间过滤（正例）
 *    10. applyFilters — 无候选返回空（边界）
 *    11. scoreItems — 有画像评分排序含调整分（正例）
 *    12. getExplanation — 存在的商品有解释（正例）
 *    13. getExplanation — 不存在的商品返回空解释（反例）
 *  - Delivery:
 *    14. getDeliveries — 根据用户返回分发历史（正例）
 *    15. getDeliveries — 空 userId 返回空（边界）
 *    16. markDelivered — 标记 pending 状态为 sent（正例）
 *    17. markDelivered — 不存在的 deliveryId 返回 null（反例）
 *    18. getChannel — 获取有效渠道信息（正例）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { D3Service } from './d3.service'
import { RecommendContext, RecommendPeriod, RecommendChannel, FilterRuleType } from './d3.dto'
import type { RecommendItem, FilterRule } from './d3.service'

describe('D3Service — Discovery', () => {
  let service: D3Service

  beforeEach(() => {
    service = new D3Service()
  })

  describe('getRecommendations', () => {
    it('应基于用户画像返回匹配的推荐结果（正例）', () => {
      const result = service.getRecommendations('user-001', RecommendContext.HOME, 5)
      expect(result.items.length).toBeGreaterThanOrEqual(1)
      expect(result.context).toBe(RecommendContext.HOME)
      expect(result.items.every((item) => item.score > 0)).toBe(true)
      // user-001 偏好 electronics/sports，应有一些匹配项
      const electronicsOrSports = result.items.filter(
        (item) => item.category === 'electronics' || item.category === 'sports',
      )
      expect(electronicsOrSports.length).toBeGreaterThan(0)
    })

    it('对不存在的用户应返回基于通用规则的推荐（反例）', () => {
      const result = service.getRecommendations('unknown-user', RecommendContext.HOME, 3)
      expect(result.items.length).toBeGreaterThanOrEqual(1)
      expect(result.items.length).toBeLessThanOrEqual(3)
      expect(result.total).toBe(result.items.length)
    })

    it('limit 为 0 时应至少返回 1 项（边界）', () => {
      const result = service.getRecommendations('user-001', RecommendContext.HOME, 0)
      expect(result.items.length).toBe(1)
      expect(result.total).toBe(1)
    })
  })

  describe('getTrendingItems', () => {
    it('应按指定类型和周期返回热门商品（正例）', () => {
      const result = service.getTrendingItems('electronics', RecommendPeriod.WEEK)
      expect(result.type).toBe('electronics')
      expect(result.period).toBe(RecommendPeriod.WEEK)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.items.every((item) => item.type === 'electronics')).toBe(true)
    })

    it('空类型应返回空结果（反例/边界）', () => {
      const result = service.getTrendingItems('', RecommendPeriod.TODAY)
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getPersonalPicks', () => {
    it('有用户画像时返回个性化选品（正例）', () => {
      const picks = service.getPersonalPicks('user-001')
      expect(picks.length).toBeGreaterThan(0)
      // user-001 偏好 electronics，应该至少返回一条带"匹配"理由的
      const withReason = picks.filter((p) => p.reason.includes('匹配'))
      expect(withReason.length).toBeGreaterThan(0)
    })

    it('无用户画像时返回默认选品（反例）', () => {
      const picks = service.getPersonalPicks('no-such-user')
      expect(picks.length).toBeGreaterThan(0)
      expect(picks[0].reason).toBe('默认推荐')
    })
  })
})

describe('D3Service — Decision', () => {
  let service: D3Service

  beforeEach(() => {
    service = new D3Service()
  })

  describe('applyFilters', () => {
    it('应按照类别规则正确过滤候选（正例）', () => {
      const candidates = ['item-001', 'item-002', 'item-003', 'item-004']
      const rules: FilterRule[] = [{ type: FilterRuleType.CATEGORY, value: 'electronics' }]
      const result = service.applyFilters(candidates, rules)
      expect(result).toContain('item-001')
      expect(result).toContain('item-002')
      expect(result).not.toContain('item-003')
      expect(result).not.toContain('item-004')
    })

    it('应按照价格区间规则正确过滤候选（正例）', () => {
      const candidates = ['item-001', 'item-003', 'item-004', 'item-010']
      // price range 200-1000
      const rules: FilterRule[] = [{ type: FilterRuleType.PRICE_RANGE, value: '200-1000' }]
      const result = service.applyFilters(candidates, rules)
      expect(result).toContain('item-003')  // 899
      expect(result).toContain('item-004')  // 268
      expect(result).not.toContain('item-001') // 2999 > 1000
      expect(result).toContain('item-010')  // 349 (within 200-1000, should be included)
    })

    it('候选为空时返回空数组（边界）', () => {
      const rules: FilterRule[] = [{ type: FilterRuleType.CATEGORY, value: 'electronics' }]
      const result = service.applyFilters([], rules)
      expect(result).toHaveLength(0)
    })

    it('应按照评分规则过滤候选（正例）', () => {
      const candidates = ['item-001', 'item-002', 'item-010']
      const rules: FilterRule[] = [{ type: FilterRuleType.RATING, value: '4.5' }]
      const result = service.applyFilters(candidates, rules)
      expect(result).toContain('item-001') // rating 4.8
      expect(result).toContain('item-002') // rating 4.6
      expect(result).not.toContain('item-010') // rating 4.0
    })
  })

  describe('scoreItems', () => {
    it('应基于用户画像调整评分并排序（正例）', () => {
      const items = ['item-001', 'item-003', 'item-006']
      const result = service.scoreItems(items, 'user-001')
      expect(result.length).toBe(3)
      expect(result.every((r) => r.adjustedScore >= 0)).toBe(true)
      // item-001 (electronics) should get category bonus for user-001
      const item1 = result.find((r) => r.id === 'item-001')
      expect(item1!.adjustedScore).toBeGreaterThan(item1!.originalScore)
    })
  })

  describe('getExplanation', () => {
    it('存在的商品应返回完整解释（正例）', () => {
      const explanation = service.getExplanation('item-001', 95)
      expect(explanation.itemId).toBe('item-001')
      expect(explanation.score).toBe(95)
      expect(explanation.reasons.length).toBeGreaterThan(0)
      expect(explanation.factors.length).toBeGreaterThan(0)
      expect(explanation.confidence).toBeGreaterThan(0)
      expect(explanation.confidence).toBeLessThanOrEqual(100)
    })

    it('不存在的商品应返回全 0 空解释（反例）', () => {
      const explanation = service.getExplanation('non-existent-item', 0)
      expect(explanation.score).toBe(0)
      expect(explanation.reasons).toHaveLength(0)
      expect(explanation.factors).toHaveLength(0)
      expect(explanation.confidence).toBe(0)
    })
  })
})

describe('D3Service — Delivery', () => {
  let service: D3Service

  beforeEach(() => {
    service = new D3Service()
  })

  describe('getDeliveries', () => {
    it('应根据用户 ID 返回对应的分发历史（正例）', () => {
      const deliveries = service.getDeliveries('user-001')
      expect(deliveries.length).toBeGreaterThan(0)
      expect(deliveries.every((d) => d.userId === 'user-001')).toBe(true)
    })

    it('空 userId 应返回空数组（边界）', () => {
      const deliveries = service.getDeliveries('')
      expect(deliveries).toHaveLength(0)
    })
  })

  describe('markDelivered', () => {
    it('应将 pending 状态的分发标记为 sent（正例）', () => {
      const result = service.markDelivered('del-002')
      expect(result).not.toBeNull()
      expect(result!.status).toBe('sent')
      expect(typeof result!.sentAt).toBe('string')
    })

    it('不存在的 deliveryId 应返回 null（反例）', () => {
      const result = service.markDelivered('non-existent-delivery')
      expect(result).toBeNull()
    })
  })

  describe('getChannel', () => {
    it('应返回有效的渠道信息（正例）', () => {
      const channel = service.getChannel(RecommendChannel.PUSH)
      expect(channel.channel).toBe(RecommendChannel.PUSH)
      expect(channel.supported).toBe(true)
      expect(channel.maxItems).toBe(3)
      expect(channel.name).toBe('推送通知')
    })
  })
})
