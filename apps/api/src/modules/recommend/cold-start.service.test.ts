import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { ColdStartService, type ColdStartContext } from './cold-start.service'

describe('ColdStartService', () => {
  let service: ColdStartService

  beforeEach(() => {
    service = new ColdStartService()
  })

  describe('detect', () => {
    it('should detect cold start for anonymous visitor', () => {
      const ctx: ColdStartContext = {
        hasMemberId: false,
        purchaseCount: 0,
        viewCount: 0,
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toBe('匿名访问')
      expect(result.fallbackStrategy).toBe('popular')
    })

    it('should detect cold start for NEW lifecycle stage', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 0,
        viewCount: 0,
        lifecycleStage: 'NEW',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toBe('新会员无历史')
      expect(result.fallbackStrategy).toBe('popular')
    })

    it('should detect cold start when purchase count below threshold', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 1,
        viewCount: 10,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toContain('购买历史')
      expect(result.fallbackStrategy).toBe('popular')
    })

    it('should detect cold start when view count below threshold', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 5,
        viewCount: 3,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(true)
      expect(result.reason).toContain('浏览历史')
      expect(result.fallbackStrategy).toBe('popular')
    })

    it('should return false for normal member with sufficient history', () => {
      const ctx: ColdStartContext = {
        hasMemberId: true,
        purchaseCount: 10,
        viewCount: 30,
        lifecycleStage: 'ACTIVE',
      }

      const result = service.detect(ctx)

      expect(result.isColdStart).toBe(false)
      expect(result.fallbackStrategy).toBe('item-cf')
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
      expect(result.fallbackStrategy).toBe('item-cf')
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

    it('should return false when both conditions fail', () => {
      const result = service.canItemCF({ hasContextItemId: false, itemPurchaseCount: 0 })
      expect(result).toBe(false)
    })
  })
})
