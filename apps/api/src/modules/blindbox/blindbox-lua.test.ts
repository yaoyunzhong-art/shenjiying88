/**
 * blindbox-lua.test.ts — Redis Lua 原子操作测试
 *
 * BS-0267: 验证盲盒库存扣减的 Lua 原子操作
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BlindboxLuaService } from './blindbox-lua.service'

describe('BlindboxLuaService', () => {
  let lua: BlindboxLuaService

  beforeEach(() => {
    lua = new BlindboxLuaService()
    lua.resetTestState()
  })

  describe('drawAtomic', () => {
    it('库存充足时应成功扣减并返回剩余库存', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 10)

      const result = await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      expect(result.success).toBe(true)
      expect(result.prizeId).toBe('prize-a')
      expect(result.remainingStock).toBe(9)
    })

    it('库存为0时应返回 OUT_OF_STOCK', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 0)

      const result = await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      expect(result.success).toBe(false)
      expect(result.error).toBe('OUT_OF_STOCK')
    })

    it('库未初始化时应返回 OUT_OF_STOCK', async () => {
      const result = await lua.drawAtomic('plan-1', 'tier-1', 'prize-x', 'user-1')
      expect(result.success).toBe(false)
      expect(result.error).toBe('OUT_OF_STOCK')
    })

    it('连续抽奖应逐次减少库存', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 3)

      const r1 = await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      expect(r1.remainingStock).toBe(2)

      const r2 = await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      expect(r2.remainingStock).toBe(1)

      const r3 = await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      expect(r3.remainingStock).toBe(0)

      const r4 = await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      expect(r4.success).toBe(false)
      expect(r4.error).toBe('OUT_OF_STOCK')
    })

    it('不同奖品之间的库存隔离', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 5)
      lua.initStock('plan-1', 'tier-1', 'prize-b', 3)

      await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')
      await lua.drawAtomic('plan-1', 'tier-1', 'prize-b', 'user-1')

      expect(lua.getStock('plan-1', 'tier-1', 'prize-a')).toBe(4) // 5-1
      expect(lua.getStock('plan-1', 'tier-1', 'prize-b')).toBe(2) // 3-1
    })
  })

  describe('batchDrawAtomic', () => {
    it('十连抽全部成功', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 10)

      const items = Array.from({ length: 10 }, (_, i) => ({
        tierId: 'tier-1',
        prizeId: 'prize-a',
      }))

      const result = await lua.batchDrawAtomic('plan-1', items, 'user-1')
      expect(result.success).toBe(true)
      expect(result.totalAwarded).toBe(10)
      expect(lua.getStock('plan-1', 'tier-1', 'prize-a')).toBe(0)
    })

    it('部分库存不足时应返回部分成功', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 3)

      const items = Array.from({ length: 5 }, () => ({
        tierId: 'tier-1',
        prizeId: 'prize-a',
      }))

      const result = await lua.batchDrawAtomic('plan-1', items, 'user-1')
      expect(result.success).toBe(false) // 部分失败
      expect(result.totalAwarded).toBe(3)
      expect(result.results.filter(r => r.success).length).toBe(3)
      expect(result.results.filter(r => !r.success).length).toBe(2)
    })
  })

  describe('checkStock', () => {
    it('库存充足时应返回不需要补货', () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 10)
      const result = lua.checkStock('plan-1', 'tier-1', 'prize-a', 10)
      expect(result.stock).toBe(10)
      expect(result.needsRestock).toBe(false)
    })

    it('库存为0时应返回需要补货', () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 0)
      const result = lua.checkStock('plan-1', 'tier-1', 'prize-a', 10)
      expect(result.stock).toBe(0)
      expect(result.needsRestock).toBe(true)
    })

    it('checkMultiStock 应返回多个结果', () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 1)
      lua.initStock('plan-1', 'tier-1', 'prize-b', 0)

      const results = lua.checkMultiStock([
        { planId: 'plan-1', tierId: 'tier-1', prizeId: 'prize-a', originalStock: 10 },
        { planId: 'plan-1', tierId: 'tier-1', prizeId: 'prize-b', originalStock: 10 },
      ])

      expect(results[0].needsRestock).toBe(false)
      expect(results[1].needsRestock).toBe(true)
    })
  })

  describe('脚本管理', () => {
    it('默认应加载核心脚本', () => {
      expect(lua.hasScript).toBeDefined()
    })

    it('loadScript 应返回 SHA', () => {
      const sha = lua.loadScript('-- my custom script')
      expect(sha).toMatch(/^sha_[0-9a-f]{8}$/)
    })
  })

  describe('记录管理', () => {
    it('抽奖后应记录', async () => {
      lua.initStock('plan-1', 'tier-1', 'prize-a', 5)
      await lua.drawAtomic('plan-1', 'tier-1', 'prize-a', 'user-1')

      expect(lua.getRecordCount('plan-1')).toBe(1)
    })
  })
})
