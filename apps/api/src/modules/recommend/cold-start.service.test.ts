import { describe, it, expect, beforeEach } from 'vitest'
import { ColdStartService, type ColdStartContext, type ItemColdStartContext } from './cold-start.service'

describe('ColdStartService', () => {
  let service: ColdStartService

  beforeEach(() => {
    service = new ColdStartService()
  })

  describe('detect (V18 D3 增强)', () => {
    it('should detect full cold start for anonymous visitor', () => {
      const ctx: ColdStartContext = {
        hasMemberId: false,
        purchaseCount: 0,
        viewCount: 0,
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.level).toBe('full')
      expect(result.reason).toBe('匿名访问')
      expect(result.fallbackStrategy).toBe('popular-heatmap')
    })

    it('should detect full cold start for NEW lifecycle stage', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 0,
        viewCount: 0,
        lifecycleStage: 'NEW',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.level).toBe('full')
      expect(result.reason).toBe('新会员无历史')
      expect(result.fallbackStrategy).toBe('popular-heatmap')
      expect(result.recommendedStrategies).toContain('category-tag')
    })

    it('should detect partial cold start when purchase count below threshold', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 1,
        viewCount: 10,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.level).toBe('partial')
      expect(result.reason).toContain('购买历史')
      expect(result.fallbackStrategy).toBe('popular-heatmap')
    })

    it('should detect partial cold start when view count below threshold', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 5,
        viewCount: 3,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.level).toBe('partial')
      expect(result.reason).toContain('浏览历史')
    })

    it('should return normal for member with sufficient history', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 10,
        viewCount: 30,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(false)
      expect(result.level).toBe('none')
      expect(result.fallbackStrategy).toBe('item-cf')
      expect(result.recommendedStrategies).toContain('user-cf')
    })

    it('should handle ACTIVE lifecycle stage with sufficient history', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 5,
        viewCount: 10,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(false)
      expect(result.level).toBe('none')
    })
  })

  describe('canItemCF', () => {
    it('should return true when contextItemId exists and item has enough purchases', () => {
      const result = service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 5 })
      expect(result).toBe(true)
    })

    it('should return true when item has exactly threshold purchases', () => {
      const result = service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 2 })
      expect(result).toBe(true)
    })

    it('should return false when no contextItemId', () => {
      const result = service.canItemCF({ hasContextItemId: false, itemPurchaseCount: 5 })
      expect(result).toBe(false)
    })

    it('should return false when item purchase count below threshold', () => {
      const result = service.canItemCF({ hasContextItemId: true, itemPurchaseCount: 1 })
      expect(result).toBe(false)
    })
  })

  // ---- V18 D3 商品冷启动测试 ----

  describe('detectItemColdStart (V18 D3 新增)', () => {
    it('should detect new item with zero purchases', () => {
      const ctx: ItemColdStartContext = {
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: ['premium'],
        purchaseCount: 0,
        viewCount: 0,
        daysSinceCreation: 2,
      }

      const result = service.detectItemColdStart(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toContain('无销量')
      expect(result.recommendedStrategy).toBe('category-popular')
    })

    it('should detect item with low purchases and tags', () => {
      const ctx: ItemColdStartContext = {
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: ['premium', 'new'],
        purchaseCount: 1,
        viewCount: 50,
        daysSinceCreation: 30,
      }

      const result = service.detectItemColdStart(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toContain('销量低')
      expect(result.recommendedStrategy).toBe('similar-tags')
    })

    it('should detect item with low purchases and no tags', () => {
      const ctx: ItemColdStartContext = {
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: [],
        purchaseCount: 2,
        viewCount: 50,
        daysSinceCreation: 15,
      }

      const result = service.detectItemColdStart(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.recommendedStrategy).toBe('category-similarity')
    })

    it('should detect low exposure item', () => {
      const ctx: ItemColdStartContext = {
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: [],
        purchaseCount: 5,
        viewCount: 3,
        daysSinceCreation: 30,
      }

      const result = service.detectItemColdStart(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toContain('曝光不足')
      expect(result.recommendedStrategy).toBe('category-popular')
    })

    it('should return normal for established item', () => {
      const ctx: ItemColdStartContext = {
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: ['premium'],
        purchaseCount: 10,
        viewCount: 50,
        daysSinceCreation: 60,
      }

      const result = service.detectItemColdStart(ctx)

      expect(result.isColdStart).toBe(false)
      expect(result.recommendedStrategy).toBe('normal')
    })
  })

  describe('getItemFallbackStrategy', () => {
    it('should map category-popular to popular-heatmap', () => {
      const decision = service.detectItemColdStart({
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: [],
        purchaseCount: 0,
        viewCount: 0,
        daysSinceCreation: 1,
      })

      const strategy = service.getItemFallbackStrategy(decision)
      expect(strategy).toBe('popular-heatmap')
    })

    it('should map similar-tags to category-tag', () => {
      const decision = service.detectItemColdStart({
        tenantId: 'T',
        itemId: 'A',
        category: 'tech',
        tags: ['premium'],
        purchaseCount: 1,
        viewCount: 50,
        daysSinceCreation: 30,
      })

      const strategy = service.getItemFallbackStrategy(decision)
      expect(strategy).toBe('category-tag')
    })
  })
})
