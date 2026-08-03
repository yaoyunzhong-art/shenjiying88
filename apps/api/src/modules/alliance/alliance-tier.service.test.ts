import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceTierService } from './alliance-tier.service'

describe('AllianceTierService — 分级联盟 (BS-0218~BS-0219)', () => {
  let service: AllianceTierService

  beforeEach(() => {
    service = new AllianceTierService()
  })

  describe('getTierConfig', () => {
    it('should return default config for S grade', () => {
      const config = service.getTierConfig('S')
      expect(config.grade).toBe('S')
      expect(config.label).toBe('战略伙伴')
      expect(config.revenueShareRatio).toBe(0.08)
      expect(config.couponCommissionRatio).toBe(0.15)
      expect(config.benefits).toContain('优先结算')
    })

    it('should return default config for C grade with lowest ratio', () => {
      const config = service.getTierConfig('C')
      expect(config.grade).toBe('C')
      expect(config.label).toBe('普通伙伴')
      expect(config.revenueShareRatio).toBe(0.02)
      expect(config.couponCommissionRatio).toBe(0.08)
    })
  })

  describe('setTierConfig', () => {
    it('should override revenue share ratio for a grade', () => {
      const updated = service.setTierConfig('S', { revenueShareRatio: 0.10 })
      expect(updated.revenueShareRatio).toBe(0.10)

      const config = service.getTierConfig('S')
      expect(config.revenueShareRatio).toBe(0.10)
    })

    it('should keep other fields unchanged after partial override', () => {
      service.setTierConfig('A', { revenueShareRatio: 0.07 })
      const config = service.getTierConfig('A')
      expect(config.revenueShareRatio).toBe(0.07)
      expect(config.grade).toBe('A')
      expect(config.couponCommissionRatio).toBe(0.12) // unchanged
    })
  })

  describe('calculateRevenueShare', () => {
    it('should calculate revenue share based on grade ratio', () => {
      // S: 0.08 of orderAmount
      const shareS = service.calculateRevenueShare('S', 100000) // 100元
      expect(shareS).toBe(8000) // 8元

      // C: 0.02 of orderAmount
      const shareC = service.calculateRevenueShare('C', 100000)
      expect(shareC).toBe(2000) // 2元
    })

    it('should return 0 for zero order amount', () => {
      const share = service.calculateRevenueShare('S', 0)
      expect(share).toBe(0)
    })
  })

  describe('calculateCouponCommission', () => {
    it('should calculate commission based on grade ratio', () => {
      // S: 0.15 of couponDiscount
      const commission = service.calculateCouponCommission('S', 5000) // 5元券
      expect(commission).toBe(750) // 0.75元佣金

      // C: 0.08 of couponDiscount
      const commissionC = service.calculateCouponCommission('C', 5000)
      expect(commissionC).toBe(400) // 0.40元
    })
  })

  describe('getGradeLabel', () => {
    it('should return correct labels', () => {
      expect(service.getGradeLabel('S')).toBe('战略伙伴')
      expect(service.getGradeLabel('A')).toBe('核心伙伴')
      expect(service.getGradeLabel('B')).toBe('优质伙伴')
      expect(service.getGradeLabel('C')).toBe('普通伙伴')
    })
  })

  describe('recordGradeChange', () => {
    it('should record a grade change and return history', () => {
      const record = service.recordGradeChange('partner-1', 'B', 'A', 'Auto-upgrade')
      expect(record.partnerId).toBe('partner-1')
      expect(record.fromGrade).toBe('B')
      expect(record.toGrade).toBe('A')
      expect(record.reason).toBe('Auto-upgrade')

      const history = service.getGradeChangeHistory('partner-1')
      expect(history).toHaveLength(1)
      expect(history[0].toGrade).toBe('A')
    })

    it('should return empty history for unknown partner', () => {
      const history = service.getGradeChangeHistory('unknown')
      expect(history).toEqual([])
    })
  })
})
