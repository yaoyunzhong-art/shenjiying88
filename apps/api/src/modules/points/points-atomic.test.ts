import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import {
  PointsAtomicService,
  PointsConfigValidator,
  resetTestState,
  type IssuanceRule,
  type RedemptionRule,
  type InflationParams
} from './points-atomic.service'

describe('PointsAtomicService', () => {
  let svc: PointsAtomicService

  beforeEach(() => {
    resetTestState()
    svc = new PointsAtomicService()
  })

  describe('incrementPointsAtomic', () => {
    it('增加积分成功返回新余额', async () => {
      const result = await svc.incrementPointsAtomic('m1', 100, 'signin')
      expect(result.success).toBe(true)
      expect(result.data).toBe(100)
      expect(svc.getBalance('m1')).toBe(100)
    })

    it('扣减积分成功返回新余额', async () => {
      svc.getBalance('m1')
      await svc.incrementPointsAtomic('m1', 100, 'signin')
      const result = await svc.incrementPointsAtomic('m1', -30, 'redeem')
      expect(result.success).toBe(true)
      expect(result.data).toBe(70)
    })

    it('扣减导致负余额返回错误', async () => {
      await svc.incrementPointsAtomic('m1', 50, 'signin')
      const result = await svc.incrementPointsAtomic('m1', -100, 'redeem')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient')
    })

    it('并发增加积分最终值正确', async () => {
      await svc.incrementPointsAtomic('m1', 0, 'init')
      const promises = Array.from({ length: 10 }, () =>
        svc.incrementPointsAtomic('m1', 10, 'concurrent')
      )
      const results = await Promise.all(promises)
      results.forEach(r => expect(r.success).toBe(true))
      expect(svc.getBalance('m1')).toBe(100)
    })

    it('并发增减积分最终值一致', async () => {
      await svc.incrementPointsAtomic('m1', 100, 'init')
      const promises = [
        svc.incrementPointsAtomic('m1', 50, 'add1'),
        svc.incrementPointsAtomic('m1', -20, 'sub1'),
        svc.incrementPointsAtomic('m1', 30, 'add2'),
        svc.incrementPointsAtomic('m1', -10, 'sub2')
      ]
      await Promise.all(promises)
      expect(svc.getBalance('m1')).toBe(150)
    })
  })

  describe('transferPointsAtomic', () => {
    it('转账成功双方余额正确', async () => {
      await svc.incrementPointsAtomic('m1', 200, 'init')
      const result = await svc.transferPointsAtomic('m1', 'm2', 80)
      expect(result.success).toBe(true)
      expect(result.data?.fromNewBalance).toBe(120)
      expect(result.data?.toNewBalance).toBe(80)
    })

    it('from余额不足整个转账失败', async () => {
      await svc.incrementPointsAtomic('m1', 50, 'init')
      const result = await svc.transferPointsAtomic('m1', 'm2', 100)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient')
      expect(svc.getBalance('m1')).toBe(50)
      expect(svc.getBalance('m2')).toBe(0)
    })

    it('转账给自己返回错误', async () => {
      await svc.incrementPointsAtomic('m1', 100, 'init')
      const result = await svc.transferPointsAtomic('m1', 'm1', 50)
      expect(result.success).toBe(false)
      expect(result.error).toContain('self')
    })

    it('负数金额返回错误', async () => {
      const result = await svc.transferPointsAtomic('m1', 'm2', -10)
      expect(result.success).toBe(false)
      expect(result.error).toContain('positive')
    })

    it('转账原子性：失败时双方余额不变', async () => {
      await svc.incrementPointsAtomic('m1', 50, 'init')
      await svc.incrementPointsAtomic('m2', 100, 'init')
      const result = await svc.transferPointsAtomic('m1', 'm2', 100)
      expect(result.success).toBe(false)
      expect(svc.getBalance('m1')).toBe(50)
      expect(svc.getBalance('m2')).toBe(100)
    })
  })

  describe('deductForPurchaseAtomic', () => {
    it('首次扣减成功', async () => {
      await svc.incrementPointsAtomic('m1', 500, 'init')
      const result = await svc.deductForPurchaseAtomic('m1', 200, 'order-001')
      expect(result.success).toBe(true)
      expect(result.data?.alreadyProcessed).toBe(false)
      expect(result.data?.newBalance).toBe(300)
    })

    it('同一orderId第二次调用返回已处理', async () => {
      await svc.incrementPointsAtomic('m1', 500, 'init')
      await svc.deductForPurchaseAtomic('m1', 200, 'order-001')
      const result = await svc.deductForPurchaseAtomic('m1', 200, 'order-001')
      expect(result.success).toBe(true)
      expect(result.data?.alreadyProcessed).toBe(true)
      expect(svc.getBalance('m1')).toBe(300)
    })

    it('余额不足扣减失败', async () => {
      await svc.incrementPointsAtomic('m1', 100, 'init')
      const result = await svc.deductForPurchaseAtomic('m1', 200, 'order-002')
      expect(result.success).toBe(false)
      expect(svc.getBalance('m1')).toBe(100)
    })

    it('幂等性保证余额不会被重复扣减', async () => {
      await svc.incrementPointsAtomic('m1', 500, 'init')
      await svc.deductForPurchaseAtomic('m1', 200, 'order-003')
      await svc.deductForPurchaseAtomic('m1', 200, 'order-003')
      await svc.deductForPurchaseAtomic('m1', 200, 'order-003')
      expect(svc.getBalance('m1')).toBe(300)
    })
  })

  describe('batchAwardAtomic', () => {
    it('批量发放成功所有成员收到积分', async () => {
      const result = await svc.batchAwardAtomic(['m1', 'm2', 'm3'], 50, 'campaign')
      expect(result.success).toBe(true)
      expect(result.data?.awardedCount).toBe(3)
      expect(svc.getBalance('m1')).toBe(50)
      expect(svc.getBalance('m2')).toBe(50)
      expect(svc.getBalance('m3')).toBe(50)
    })

    it('空成员列表返回成功（积分为0）', async () => {
      const result = await svc.batchAwardAtomic([], 50, 'campaign')
      expect(result.success).toBe(true)
      expect(result.data!.awardedCount).toBe(0)
    })

    it('负数积分数返回错误', async () => {
      const result = await svc.batchAwardAtomic(['m1', 'm2'], -10, 'campaign')
      expect(result.success).toBe(false)
      expect(result.error).toContain('positive')
    })

    it('要么全成功要么全失败', async () => {
      await svc.incrementPointsAtomic('m1', 1000, 'init')
      await svc.incrementPointsAtomic('m2', 1000, 'init')
      await svc.incrementPointsAtomic('m3', 1000, 'init')
      const result = await svc.batchAwardAtomic(['m1', 'm2', 'm3'], 100, 'batch')
      expect(result.success).toBe(true)
      expect(svc.getBalance('m1')).toBe(1100)
      expect(svc.getBalance('m2')).toBe(1100)
      expect(svc.getBalance('m3')).toBe(1100)
    })
  })

  // ── BS-0264: 先更新DB再删缓存 ────────────────────────────────────────────

  describe('BS-0264 先更新DB再删缓存', () => {
    it('incrementPointsAtomic 后应清除缓存', async () => {
      const result = await svc.incrementPointsAtomic('member-1', 100, 'test')
      expect(result.success).toBe(true)
      expect(svc.isCacheEvicted('member-1')).toBe(true)
    })

    it('transferPointsAtomic 后应清除双方缓存', async () => {
      await svc.incrementPointsAtomic('member-a', 500, 'funding')
      const result = await svc.transferPointsAtomic('member-a', 'member-b', 200)
      expect(result.success).toBe(true)
      expect(svc.isCacheEvicted('member-a')).toBe(true)
      expect(svc.isCacheEvicted('member-b')).toBe(true)
    })

    it('deductForPurchaseAtomic 后应清除缓存', async () => {
      await svc.incrementPointsAtomic('member-1', 500, 'funding')
      const result = await svc.deductForPurchaseAtomic('member-1', 100, 'order-1')
      expect(result.success).toBe(true)
      expect(svc.isCacheEvicted('member-1')).toBe(true)
    })

    it('batchAwardAtomic 后应清除所有目标缓存', async () => {
      const ids = ['member-batch-a', 'member-batch-b', 'member-batch-c']
      const result = await svc.batchAwardAtomic(ids, 50, 'batch test')
      expect(result.success).toBe(true)
      for (const id of ids) {
        expect(svc.isCacheEvicted(id)).toBe(true)
      }
    })

    it('缓存键格式正确', () => {
      const key = svc.getCacheKey('member-x')
      expect(key).toBe('points:balance:member-x')
    })
  })
})

describe('PointsConfigValidator', () => {
  let validator: PointsConfigValidator

  beforeEach(() => {
    validator = new PointsConfigValidator()
  })

  describe('validateIssuanceRule', () => {
    it('合法发放规则通过校验', () => {
      const rule: IssuanceRule = { singleMax: 100, dailyMax: 500, monthlyMax: 2000 }
      expect(() => validator.validateIssuanceRule(rule)).not.toThrow()
    })

    it('单次上限非正数抛出错误', () => {
      const rule: IssuanceRule = { singleMax: 0, dailyMax: 500, monthlyMax: 2000 }
      expect(() => validator.validateIssuanceRule(rule)).toThrow('Single issuance max must be positive')
    })

    it('日上限小于单次上限抛出错误', () => {
      const rule: IssuanceRule = { singleMax: 100, dailyMax: 50, monthlyMax: 2000 }
      expect(() => validator.validateIssuanceRule(rule)).toThrow('Daily max must be >= single max')
    })

    it('月上限小于日上限抛出错误', () => {
      const rule: IssuanceRule = { singleMax: 100, dailyMax: 500, monthlyMax: 200 }
      expect(() => validator.validateIssuanceRule(rule)).toThrow('Monthly max must be >= daily max')
    })
  })

  describe('validateRedemptionRule', () => {
    it('合法兑换规则通过校验', () => {
      const rule: RedemptionRule = { minBalance: 10, singleMax: 1000 }
      expect(() => validator.validateRedemptionRule(rule)).not.toThrow()
    })

    it('最低余额为负数抛出错误', () => {
      const rule: RedemptionRule = { minBalance: -5, singleMax: 1000 }
      expect(() => validator.validateRedemptionRule(rule)).toThrow('Minimum balance cannot be negative')
    })

    it('单次上限非正数抛出错误', () => {
      const rule: RedemptionRule = { minBalance: 10, singleMax: 0 }
      expect(() => validator.validateRedemptionRule(rule)).toThrow('Single redemption max must be positive')
    })

    it('单次上限小于最低余额抛出错误', () => {
      const rule: RedemptionRule = { minBalance: 100, singleMax: 50 }
      expect(() => validator.validateRedemptionRule(rule)).toThrow('Single max must be >= minimum balance')
    })
  })

  describe('validateInflationParams', () => {
    it('合法通胀参数通过校验', () => {
      const params: InflationParams = { threshold: 10000, warningRatio: 0.8 }
      expect(() => validator.validateInflationParams(params)).not.toThrow()
    })

    it('阈值非正数抛出错误', () => {
      const params: InflationParams = { threshold: 0, warningRatio: 0.8 }
      expect(() => validator.validateInflationParams(params)).toThrow('Inflation threshold must be positive')
    })

    it('预警比例超出0-1范围抛出错误', () => {
      const params: InflationParams = { threshold: 10000, warningRatio: 1.5 }
      expect(() => validator.validateInflationParams(params)).toThrow('Warning ratio must be between 0 and 1')
    })

    it('预警比例为0抛出错误', () => {
      const params: InflationParams = { threshold: 10000, warningRatio: 0 }
      expect(() => validator.validateInflationParams(params)).toThrow('Warning ratio must be between 0 and 1')
    })
  })
})
