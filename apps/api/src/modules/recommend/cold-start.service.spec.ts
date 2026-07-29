/**
 * cold-start.service.spec.ts — T170 ColdStartService 冷启动策略测试
 *
 * 覆盖 30+ 测试用例:
 *  - detect: 匿名/新会员/purchase不足/view不足 → 冷启动等级
 *  - detect: 数据充足 → none
 *  - canItemCF: context+item purchase check
 *  - detectItemColdStart: 新商品/低销量/曝光不足/正常
 *  - getItemFallbackStrategy: 策略映射
 *  - 边界: 零值 / 大数字 / 混合阈值
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { ColdStartService, type ColdStartContext, type ItemColdStartContext } from './cold-start.service'

// ── Helper factories ────────────────────────────────────────────────────────

function makeColdStartCtx(overrides: Partial<ColdStartContext> = {}): ColdStartContext {
  return {
    hasMemberId: true,
    purchaseCount: 10,
    viewCount: 20,
    lifecycleStage: 'ACTIVE',
    ...overrides,
  }
}

function makeItemCtx(overrides: Partial<ItemColdStartContext> = {}): ItemColdStartContext {
  return {
    tenantId: 'tenant-a',
    itemId: 'item-001',
    category: '电子产品',
    tags: ['手机', '5G'],
    purchaseCount: 10,
    viewCount: 50,
    daysSinceCreation: 30,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ColdStartService', () => {
  let service: ColdStartService

  beforeEach(() => {
    service = new ColdStartService()
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 1. detect — 冷启动判断
  // ═════════════════════════════════════════════════════════════════════════

  describe('detect — 冷启动判断', () => {
    it('should return full cold start for anonymous users (no memberId)', () => {
      const decision = service.detect(makeColdStartCtx({ hasMemberId: false }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('full')
      expect(decision.reason).toContain('匿名')
      expect(decision.fallbackStrategy).toBe('popular-heatmap')
    })

    it('should return full cold start for NEW lifecycle stage', () => {
      const decision = service.detect(makeColdStartCtx({ lifecycleStage: 'NEW', purchaseCount: 0, viewCount: 0 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('full')
      expect(decision.reason).toContain('新会员')
      expect(decision.recommendedStrategies).toContain('popular-heatmap')
      expect(decision.recommendedStrategies).toContain('category-tag')
    })

    it('should return partial cold start when purchaseCount < threshold (3)', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 1, viewCount: 10 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('partial')
      expect(decision.reason).toContain('购买')
    })

    it('should return partial cold start when purchaseCount is 0', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 0, viewCount: 10 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('partial')
    })

    it('should return partial cold start when purchaseCount is 2 (just under threshold)', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 2, viewCount: 10 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('partial')
    })

    it('should return partial cold start when viewCount < threshold (5)', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 5, viewCount: 2 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('partial')
      expect(decision.reason).toContain('浏览')
    })

    it('should return partial cold start when viewCount is 0', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 5, viewCount: 0 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('partial')
    })

    it('should return partial cold start when both purchase and view are low', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 1, viewCount: 1 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('partial')
      // purchase threshold checked first
      expect(decision.reason).toContain('购买')
    })

    it('should return none when both purchase and view exceed thresholds', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 5, viewCount: 10 }))
      expect(decision.isColdStart).toBe(false)
      expect(decision.level).toBe('none')
      expect(decision.fallbackStrategy).toBe('item-cf')
      expect(decision.recommendedStrategies).toContain('item-cf')
      expect(decision.recommendedStrategies).toContain('user-cf')
      expect(decision.recommendedStrategies).toContain('personalized')
    })

    it('should return none for actively purchasing users', () => {
      const decision = service.detect(makeColdStartCtx({ purchaseCount: 100, viewCount: 500 }))
      expect(decision.isColdStart).toBe(false)
      expect(decision.level).toBe('none')
    })

    it('should handle edge case: NEW lifecycle with some purchase data', () => {
      // NEW lifecycle takes precedence over purchase data
      const decision = service.detect(makeColdStartCtx({ lifecycleStage: 'NEW', purchaseCount: 10, viewCount: 50 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.level).toBe('full')
      expect(decision.reason).toContain('新会员')
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 2. canItemCF
  // ═════════════════════════════════════════════════════════════════════════

  describe('canItemCF', () => {
    it('should return true when has contextItemId and itemPurchaseCount >= threshold (2)', () => {
      expect(service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 3 })).toBe(true)
    })

    it('should return false when no contextItemId', () => {
      expect(service.canItemCF({ hasContextItemId: false, itemPurchaseCount: 10 })).toBe(false)
    })

    it('should return false when itemPurchaseCount below threshold', () => {
      expect(service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 1 })).toBe(false)
    })

    it('should return false when both conditions fail', () => {
      expect(service.canItemCF({ hasContextItemId: false, itemPurchaseCount: 0 })).toBe(false)
    })

    it('should return true at exact threshold (2)', () => {
      expect(service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 2 })).toBe(true)
    })

    it('should return false at zero purchases', () => {
      expect(service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 0 })).toBe(false)
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 3. detectItemColdStart — 商品冷启动
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectItemColdStart — 商品冷启动', () => {
    it('should detect new item with zero purchases as cold start → category-popular', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ daysSinceCreation: 3, purchaseCount: 0, viewCount: 0 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.reason).toContain('新商品')
      expect(decision.recommendedStrategy).toBe('category-popular')
    })

    it('should detect new item at exact NEW_ITEM_DAYS boundary (7) with 0 purchases', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ daysSinceCreation: 7, purchaseCount: 0 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.recommendedStrategy).toBe('category-popular')
    })

    it('should detect low-sale item with tags → similar-tags', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ purchaseCount: 1, daysSinceCreation: 30 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.reason).toContain('销量低')
      expect(decision.recommendedStrategy).toBe('similar-tags')
    })

    it('should detect low-sale item without tags → category-similarity', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ purchaseCount: 2, tags: [], daysSinceCreation: 30 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.recommendedStrategy).toBe('category-similarity')
    })

    it('should detect low-sale zero tags purchase=0 → category-similarity', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ purchaseCount: 0, tags: [], daysSinceCreation: 30 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.recommendedStrategy).toBe('category-similarity')
    })

    it('should detect low-exposure but has purchases → category-popular', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ purchaseCount: 5, viewCount: 5, daysSinceCreation: 30 }))
      expect(decision.isColdStart).toBe(true)
      expect(decision.reason).toContain('曝光')
      expect(decision.recommendedStrategy).toBe('category-popular')
    })

    it('should return not cold start for established item', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ purchaseCount: 20, viewCount: 100, daysSinceCreation: 60 }))
      expect(decision.isColdStart).toBe(false)
      expect(decision.recommendedStrategy).toBe('normal')
    })

    it('should return not cold start at exact thresholds (purchase=3, view=10)', () => {
      const decision = service.detectItemColdStart(makeItemCtx({ purchaseCount: 3, viewCount: 10, daysSinceCreation: 30 }))
      expect(decision.isColdStart).toBe(false)
      expect(decision.recommendedStrategy).toBe('normal')
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 4. getItemFallbackStrategy
  // ═════════════════════════════════════════════════════════════════════════

  describe('getItemFallbackStrategy', () => {
    it('should map category-popular → popular-heatmap', () => {
      const strategy = service.getItemFallbackStrategy({ isColdStart: true, recommendedStrategy: 'category-popular' })
      expect(strategy).toBe('popular-heatmap')
    })

    it('should map similar-tags → category-tag', () => {
      const strategy = service.getItemFallbackStrategy({ isColdStart: true, recommendedStrategy: 'similar-tags' })
      expect(strategy).toBe('category-tag')
    })

    it('should map category-similarity → popular-heatmap', () => {
      const strategy = service.getItemFallbackStrategy({ isColdStart: true, recommendedStrategy: 'category-similarity' })
      expect(strategy).toBe('popular-heatmap')
    })

    it('should default to popular for normal', () => {
      const strategy = service.getItemFallbackStrategy({ isColdStart: false, recommendedStrategy: 'normal' })
      expect(strategy).toBe('popular')
    })
  })
})
