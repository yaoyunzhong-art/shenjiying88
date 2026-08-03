import { describe, it, expect, beforeEach } from 'vitest'
import { MemberLevelDecayService } from './member-level-decay.service'
import type { DecayConfig } from './member-level.entity'

describe('MemberLevelDecayService', () => {
  let service: MemberLevelDecayService

  const buildConfig = (overrides: Partial<DecayConfig> = {}): DecayConfig => ({
    lastConsumptionDate: '2026-01-15',
    currentGrowth: 5000,
    idleDays: 0,
    ...overrides,
  })

  beforeEach(() => {
    service = new MemberLevelDecayService()
  })

  // ── calculateDecay() — 正常流程 ──
  describe('calculateDecay()', () => {
    it('should return no decay when idleDays < 90', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 50 }))
      expect(result.decayedGrowth).toBe(5000)
      expect(result.decayRate).toBe(0)
      expect(result.decayAmount).toBe(0)
      expect(result.originalGrowth).toBe(5000)
    })

    it('should return no decay when idleDays is 0', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 0 }))
      expect(result.decayedGrowth).toBe(5000)
      expect(result.decayRate).toBe(0)
    })

    it('should return no decay when idleDays exactly 89 (just before threshold)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 89 }))
      expect(result.decayedGrowth).toBe(5000)
      expect(result.decayRate).toBe(0)
    })

    it('should start monthly decay at idleDays = 90 (first month)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 90 }))
      // monthsElapsed = Math.floor((90 - 89 + 29) / 30) = Math.floor(30/30) = 1
      // decayRate = Math.min(1, 1 * 0.2) = 0.2
      expect(result.decayRate).toBe(0.2)
      expect(result.decayAmount).toBe(1000) // 5000 * 0.2
      expect(result.decayedGrowth).toBe(4000)
      expect(result.period).toBe('monthly')
    })

    it('should calculate monthly decay for idleDays = 119 (2 months)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 119 }))
      // monthsElapsed = Math.floor((119 - 89 + 29) / 30) = Math.floor(59/30) = 1
      // Wait, actual: (119-89+29)/30 = 59/30 = 1.966 → floor = 1
      // decayRate = 0.2, decayAmount = 1000
      expect(result.decayRate).toBe(0.2)
      expect(result.decayedGrowth).toBe(4000)
    })

    it('should calculate monthly decay for idleDays = 150 (3 months)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 150 }))
      // monthsElapsed = Math.floor((150 - 89 + 29) / 30) = Math.floor(90/30) = 3
      // decayRate = Math.min(1, 3 * 0.2) = 0.6
      expect(result.decayRate).toBeCloseTo(0.6)
      expect(result.decayAmount).toBe(3000) // 5000 * 0.6
      expect(result.decayedGrowth).toBe(2000)
    })

    it('should cap monthly decay at 100% for high idle months', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 179, currentGrowth: 100 }))
      // monthsElapsed = Math.floor((179 - 89 + 29) / 30) = Math.floor(119/30) = 3
      // decayRate = Math.min(1, 3 * 0.2) = 0.6
      // 100 * 0.6 = 60
      expect(result.decayedGrowth).toBe(40)
      expect(result.period).toBe('monthly')
    })

    it('should return halfYear zone at idleDays = 270 (exactly 270)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 270, currentGrowth: 5000 }))
      expect(result.decayedGrowth).toBe(0)
      expect(result.decayRate).toBe(1)
      expect(result.decayAmount).toBe(5000)
      expect(result.period).toBe('halfYear')
      expect(result.nextDecayDate).toBe('已归零')
    })

    it('should return halfYear zone for idleDays > 270', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 365, currentGrowth: 3000 }))
      expect(result.decayedGrowth).toBe(0)
      expect(result.decayRate).toBe(1)
      expect(result.decayAmount).toBe(3000)
    })

    it('should calculate quarterly decay at idleDays = 180 (first quarter)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 180 }))
      // quartersElapsed = Math.floor((180 - 179 + 89) / 90) = Math.floor(90/90) = 1
      // decayRate = Math.min(1, 1 * 0.5) = 0.5
      expect(result.period).toBe('quarterly')
      expect(result.decayRate).toBe(0.5)
      expect(result.decayAmount).toBe(2500)
      expect(result.decayedGrowth).toBe(2500)
    })

    it('should calculate quarterly decay at idleDays = 269 (last day before halfYear)', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 269 }))
      // quartersElapsed = Math.floor((269 - 179 + 89) / 90) = Math.floor(179/90) = 1
      // Wait — (269-179+89)/90 = 179/90 = 1.988 → floor = 1
      // decayRate = Math.min(1, 1 * 0.5) = 0.5
      expect(result.period).toBe('quarterly')
      expect(result.decayedGrowth).toBe(2500)
    })

    it('should handle zero currentGrowth gracefully', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 180, currentGrowth: 0 }))
      expect(result.decayedGrowth).toBe(0)
      expect(result.decayAmount).toBe(0)
      expect(result.originalGrowth).toBe(0)
    })

    it('should handle large growth values correctly', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 90, currentGrowth: 99999 }))
      expect(result.decayAmount).toBe(20000) // Math.round(99999 * 0.2) = 20000
      expect(result.decayedGrowth).toBe(79999)
    })

    it('should ensure decayedGrowth never goes below 0', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 180, currentGrowth: 1 }))
      // decayRate = 0.5, decayAmount = Math.round(1 * 0.5) = 1
      expect(result.decayedGrowth).toBe(0)
    })

    it('should handle rounding for edge growth values', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 90, currentGrowth: 3 }))
      // monthsElapsed = 1, decayRate = 0.2, decayAmount = Math.round(3 * 0.2) = 1
      expect(result.decayAmount).toBe(1)
      expect(result.decayedGrowth).toBe(2)
    })
  })

  // ── applyDecay() — 简化入口 ──
  describe('applyDecay()', () => {
    it('should return the decayed growth value', () => {
      const result = service.applyDecay(buildConfig({ idleDays: 90 }))
      expect(result).toBe(4000)
    })

    it('should return original growth when idleDays < 90', () => {
      const result = service.applyDecay(buildConfig({ idleDays: 50, currentGrowth: 5000 }))
      expect(result).toBe(5000)
    })

    it('should return 0 for idleDays >= 270', () => {
      const result = service.applyDecay(buildConfig({ idleDays: 270, currentGrowth: 5000 }))
      expect(result).toBe(0)
    })

    it('should return correct value after quarterly decay', () => {
      const result = service.applyDecay(buildConfig({ idleDays: 180, currentGrowth: 4000 }))
      expect(result).toBe(2000)
    })
  })

  // ── nextDecayDate 格式 ──
  describe('nextDecayDate', () => {
    it('should return a date string in YYYY-MM-DD format for monthly period', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 50 }))
      expect(result.nextDecayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return "已归零" for halfYear period', () => {
      const result = service.calculateDecay(buildConfig({ idleDays: 270 }))
      expect(result.nextDecayDate).toBe('已归零')
    })
  })
})
// P-38 Financial Sprint
