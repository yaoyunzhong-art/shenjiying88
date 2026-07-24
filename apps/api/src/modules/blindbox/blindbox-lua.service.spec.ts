import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BlindboxLuaService } from './blindbox-lua.service'

describe('BlindboxLuaService', () => {
  let service: BlindboxLuaService

  const planId = 'plan-001'
  const tierId = 'tier-gold'
  const prizeId = 'prize-sword'
  const userId = 'user-100'

  beforeEach(() => {
    service = new BlindboxLuaService()
  })

  afterEach(() => {
    service.resetTestState()
  })

  // ── 构造器 & 脚本管理 ──
  describe('constructor & script management', () => {
    it('should load default Lua scripts on construction', () => {
      expect(service.hasScript).toBeDefined()
    })

    it('should loadScript return a SHA-like string and cache the script', () => {
      const script = '-- test script'
      const sha = service.loadScript(script)
      expect(sha).toMatch(/^sha_[0-9a-f]{8}$/)
      expect(service.hasScript(script)).toBe(true)
    })

    it('should return false for hasScript on unknown script', () => {
      expect(service.hasScript('-- unknown script')).toBe(false)
    })
  })

  // ── initStock ──
  describe('initStock()', () => {
    it('should set initial stock correctly', () => {
      service.initStock(planId, tierId, prizeId, 100)
      expect(service.getStock(planId, tierId, prizeId)).toBe(100)
    })

    it('should overwrite existing stock', () => {
      service.initStock(planId, tierId, prizeId, 50)
      service.initStock(planId, tierId, prizeId, 200)
      expect(service.getStock(planId, tierId, prizeId)).toBe(200)
    })

    it('should allow zero initial stock', () => {
      service.initStock(planId, tierId, prizeId, 0)
      expect(service.getStock(planId, tierId, prizeId)).toBe(0)
    })
  })

  // ── drawAtomic — 正常流程 ──
  describe('drawAtomic()', () => {
    it('should draw successfully when stock is available', async () => {
      service.initStock(planId, tierId, prizeId, 10)
      const result = await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(result.success).toBe(true)
      expect(result.prizeId).toBe(prizeId)
      expect(result.remainingStock).toBe(9)
    })

    it('should decrement stock by exactly 1 per draw', async () => {
      service.initStock(planId, tierId, prizeId, 5)
      await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(service.getStock(planId, tierId, prizeId)).toBe(4)
    })

    it('should fail when stock is zero', async () => {
      service.initStock(planId, tierId, prizeId, 0)
      const result = await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('OUT_OF_STOCK')
      expect(result.remainingStock).toBe(0)
    })

    it('should fail when stock was never initialized', async () => {
      // No initStock called — stockStore returns 0
      const result = await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('OUT_OF_STOCK')
    })

    it('should record the draw in the record store', async () => {
      service.initStock(planId, tierId, prizeId, 10)
      await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(service.getRecordCount(planId)).toBe(1)
    })

    it('should handle concurrent draws exhausting stock', async () => {
      service.initStock(planId, tierId, prizeId, 1)
      const r1 = await service.drawAtomic(planId, tierId, prizeId, userId)
      const r2 = await service.drawAtomic(planId, tierId, prizeId, userId + '-2')
      expect(r1.success).toBe(true)
      expect(r2.success).toBe(false)
      expect(r2.error).toBe('OUT_OF_STOCK')
    })

    it('should track stock for multiple different prizes independently', async () => {
      service.initStock(planId, tierId, 'prize-a', 3)
      service.initStock(planId, tierId, 'prize-b', 5)
      await service.drawAtomic(planId, tierId, 'prize-a', userId)
      await service.drawAtomic(planId, tierId, 'prize-b', userId)
      await service.drawAtomic(planId, tierId, 'prize-b', userId)
      expect(service.getStock(planId, tierId, 'prize-a')).toBe(2)
      expect(service.getStock(planId, tierId, 'prize-b')).toBe(3)
    })

    it('should work with different plan IDs independently', async () => {
      service.initStock('plan-a', tierId, prizeId, 3)
      service.initStock('plan-b', tierId, prizeId, 7)
      await service.drawAtomic('plan-a', tierId, prizeId, userId)
      await service.drawAtomic('plan-a', tierId, prizeId, userId)
      await service.drawAtomic('plan-b', tierId, prizeId, userId)
      expect(service.getStock('plan-a', tierId, prizeId)).toBe(1)
      expect(service.getStock('plan-b', tierId, prizeId)).toBe(6)
    })
  })

  // ── batchDrawAtomic ──
  describe('batchDrawAtomic()', () => {
    it('should draw all items when stock is sufficient', async () => {
      service.initStock(planId, 'tier-a', 'prize-1', 10)
      service.initStock(planId, 'tier-b', 'prize-2', 10)
      service.initStock(planId, 'tier-c', 'prize-3', 10)
      const items = [
        { tierId: 'tier-a', prizeId: 'prize-1' },
        { tierId: 'tier-b', prizeId: 'prize-2' },
        { tierId: 'tier-c', prizeId: 'prize-3' },
      ]
      const result = await service.batchDrawAtomic(planId, items, userId)
      expect(result.success).toBe(true)
      expect(result.totalAwarded).toBe(3)
      expect(result.results).toHaveLength(3)
      expect(result.error).toBeUndefined()
    })

    it('should handle some items out of stock gracefully', async () => {
      service.initStock(planId, 'tier-a', 'prize-1', 0)
      service.initStock(planId, 'tier-b', 'prize-2', 10)
      const items = [
        { tierId: 'tier-a', prizeId: 'prize-1' },
        { tierId: 'tier-b', prizeId: 'prize-2' },
      ]
      const result = await service.batchDrawAtomic(planId, items, userId)
      expect(result.success).toBe(false)
      expect(result.totalAwarded).toBe(1)
      expect(result.results[0].success).toBe(false)
      expect(result.results[0].error).toBe('OUT_OF_STOCK')
      expect(result.results[1].success).toBe(true)
      expect(result.error).toBe('部分奖品库存不足')
    })

    it('should return empty results for empty items array', async () => {
      const result = await service.batchDrawAtomic(planId, [], userId)
      expect(result.success).toBe(true)
      expect(result.totalAwarded).toBe(0)
      expect(result.results).toHaveLength(0)
    })

    it('should record each successful draw in record store', async () => {
      service.initStock(planId, 'tier-a', 'prize-1', 5)
      service.initStock(planId, 'tier-b', 'prize-2', 5)
      const items = [
        { tierId: 'tier-a', prizeId: 'prize-1' },
        { tierId: 'tier-b', prizeId: 'prize-2' },
      ]
      await service.batchDrawAtomic(planId, items, userId)
      // 2 successful draws should create 2 records
      expect(service.getRecordCount(planId)).toBe(2)
    })

    it('should not create records for failed draws', async () => {
      service.initStock(planId, 'tier-a', 'prize-1', 0)
      const items = [{ tierId: 'tier-a', prizeId: 'prize-1' }]
      await service.batchDrawAtomic(planId, items, userId)
      expect(service.getRecordCount(planId)).toBe(0)
    })
  })

  // ── checkStock ──
  describe('checkStock()', () => {
    it('should return stock with needsRestock=false when stock > 0', () => {
      service.initStock(planId, tierId, prizeId, 50)
      const result = service.checkStock(planId, tierId, prizeId, 100)
      expect(result.stock).toBe(50)
      expect(result.originalStock).toBe(100)
      expect(result.needsRestock).toBe(false)
    })

    it('should return needsRestock=true when stock is 0', () => {
      service.initStock(planId, tierId, prizeId, 0)
      const result = service.checkStock(planId, tierId, prizeId, 100)
      expect(result.needsRestock).toBe(true)
    })

    it('should return originalStock as fallback when stock not initialized', () => {
      const result = service.checkStock(planId, tierId, prizeId, 80)
      expect(result.stock).toBe(80)
      expect(result.originalStock).toBe(80)
    })
  })

  // ── checkMultiStock ──
  describe('checkMultiStock()', () => {
    it('should check multiple items at once', () => {
      service.initStock(planId, 'tier-a', 'prize-1', 10)
      service.initStock(planId, 'tier-b', 'prize-2', 0)
      const items = [
        { planId, tierId: 'tier-a', prizeId: 'prize-1', originalStock: 50 },
        { planId, tierId: 'tier-b', prizeId: 'prize-2', originalStock: 30 },
      ]
      const results = service.checkMultiStock(items)
      expect(results).toHaveLength(2)
      expect(results[0].needsRestock).toBe(false)
      expect(results[0].stock).toBe(10)
      expect(results[1].needsRestock).toBe(true)
      expect(results[1].stock).toBe(0)
    })

    it('should return empty array for empty input', () => {
      const results = service.checkMultiStock([])
      expect(results).toEqual([])
    })
  })

  // ── resetTestState ──
  describe('resetTestState()', () => {
    it('should clear all stock and records', () => {
      service.initStock(planId, tierId, prizeId, 10)
      service.drawAtomic(planId, tierId, prizeId, userId)
      expect(service.getStock(planId, tierId, prizeId)).toBe(9)
      expect(service.getRecordCount(planId)).toBe(1)

      service.resetTestState()
      expect(service.getStock(planId, tierId, prizeId)).toBe(0)
      expect(service.getRecordCount(planId)).toBe(0)
    })
  })

  // ── getStock / getRecordCount ──
  describe('getStock() / getRecordCount()', () => {
    it('should return 0 for uninitialized stock', () => {
      expect(service.getStock(planId, tierId, prizeId)).toBe(0)
    })

    it('should return 0 for uninitialized record count', () => {
      expect(service.getRecordCount(planId)).toBe(0)
    })

    it('should track multiple plans record counts separately', async () => {
      service.initStock('plan-a', tierId, prizeId, 5)
      service.initStock('plan-b', tierId, prizeId, 5)
      await service.drawAtomic('plan-a', tierId, prizeId, userId)
      await service.drawAtomic('plan-a', tierId, prizeId, userId)
      await service.drawAtomic('plan-b', tierId, prizeId, userId)
      expect(service.getRecordCount('plan-a')).toBe(2)
      expect(service.getRecordCount('plan-b')).toBe(1)
    })
  })

  // ── 边界 & 异常 ──
  describe('edge cases', () => {
    it('should handle draw after stock exhausted then restocked', async () => {
      service.initStock(planId, tierId, prizeId, 1)
      await service.drawAtomic(planId, tierId, prizeId, userId)
      const r1 = await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(r1.success).toBe(false)

      service.initStock(planId, tierId, prizeId, 3)
      const r2 = await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(r2.success).toBe(true)
      expect(r2.remainingStock).toBe(2)
    })

    it('should keep records across multiple draws by same user', async () => {
      service.initStock(planId, tierId, prizeId, 5)
      await service.drawAtomic(planId, tierId, prizeId, userId)
      await service.drawAtomic(planId, tierId, prizeId, userId)
      await service.drawAtomic(planId, tierId, prizeId, userId)
      expect(service.getRecordCount(planId)).toBe(3)
    })
  })
})
// P-38 Financial Sprint
