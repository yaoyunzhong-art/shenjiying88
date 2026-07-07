import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: HealthScoreService 单元测试 (正例+反例+边界)
import { HealthScoreService, type TenantHealthInput } from './health-score.service'

describe('HealthScoreService', () => {
  let service: HealthScoreService

  beforeEach(() => {
    service = new HealthScoreService()
  })

  // ── compute ──
  describe('compute', () => {
    // 正例: 完全健康的租户
    it('should return HEALTHY for excellent metrics', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-perfect',
        p95Ms: 50,
        errorRate: 0.0005,
        quotaUsagePercent: 0.3,
        championActivityScore: 90,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.tenantId).toBe('store-perfect')
      expect(result.score).toBeGreaterThanOrEqual(80)
      expect(result.status).toBe('HEALTHY')
      expect(result.components.performance).toBe(100)
      expect(result.components.reliability).toBe(100)
      expect(result.components.quotaHealth).toBe(100)
      expect(result.recommendations).toContain('健康度良好,继续保持')
    })

    // 正例: WARNING 状态
    it('should return WARNING for borderline metrics', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-warning',
        p95Ms: 400,
        errorRate: 0.005,
        quotaUsagePercent: 0.75,
        championActivityScore: 25,
        anomalyCount30d: 5,
      }

      const result = service.compute(input)

      expect(result.status).toBe('WARNING')
      expect(result.score).toBeGreaterThanOrEqual(60)
      expect(result.score).toBeLessThan(80)
      expect(result.components.performance).toBe(70)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    // 反例: CRITICAL 状态
    it('should return CRITICAL for very poor metrics', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-critical',
        p95Ms: 5000,
        errorRate: 0.3,
        quotaUsagePercent: 1.5,
        championActivityScore: 0,
        anomalyCount30d: 40,
      }

      const result = service.compute(input)

      expect(result.status).toBe('CRITICAL')
      expect(result.score).toBeLessThan(60)
      expect(result.components.performance).toBe(10)
      expect(result.components.reliability).toBe(10)
      expect(result.recommendations.length).toBeGreaterThanOrEqual(5)
    })

    // 边界: P95 = 100ms 正好边界
    it('should handle p95Ms boundary at 100ms', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-p95',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.5,
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.performance).toBe(100)
      expect(result.score).toBeGreaterThanOrEqual(80)
    })

    // 边界: P95 = 200ms 正好边界
    it('should handle p95Ms boundary at 200ms', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-p95-200',
        p95Ms: 200,
        errorRate: 0.001,
        quotaUsagePercent: 0.5,
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.performance).toBe(90)
    })

    // 边界: 错误率刚好 0.1% (scoreReliability: <0.001→100, else <0.005→90)
    it('should handle errorRate boundary at 0.001 (strict less-than)', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-error',
        p95Ms: 100,
        errorRate: 0.001,  // NOT < 0.001, so falls to next tier: < 0.005 → 90
        quotaUsagePercent: 0.5,
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.reliability).toBe(90)
    })

    // 边界: 错误率 0.5% (scoreReliability: <0.005→90, <0.01→75)
    it('should handle errorRate boundary at 0.005 (strict less-than)', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-error-005',
        p95Ms: 100,
        errorRate: 0.005,  // NOT < 0.005, so next tier: < 0.01 → 75
        quotaUsagePercent: 0.5,
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.reliability).toBe(75)
    })

    // 边界: 配额使用率 50% (scoreQuota: <0.5→100, else <0.7→90)
    it('should handle quota boundary at 0.5 (strict less-than)', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-quota-50',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.5,  // NOT < 0.5, so next tier: < 0.7 → 90
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.quotaHealth).toBe(90)
    })

    // 边界: 配额使用率 70% (scoreQuota: <0.7→90, else <0.8→75)
    it('should handle quota boundary at 0.7 (strict less-than)', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-quota-70',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.7,  // NOT < 0.7, so next tier: < 0.8 → 75
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.quotaHealth).toBe(75)
    })

    // 边界: 配额使用率 100% (scoreQuota: <1.0→30, else fallthrough→10)
    it('should handle quota boundary at 1.0 (exactly full)', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-quota-100',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 1.0,  // NOT < 1.0, falls to final else → 10
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.quotaHealth).toBe(10)
      expect(result.recommendations.some(r => r.includes('配额'))).toBe(true)
    })

    // 边界: champion 活跃度 50 分
    it('should handle champion score boundary at 50', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-boundary-champ-50',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.5,
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      expect(result.components.community).toBe(80)
    })

    // 反例: 异常事件 > 10 应生成推荐
    it('should recommend review when anomalyCount30d > 10', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-anomaly',
        p95Ms: 50,
        errorRate: 0.001,
        quotaUsagePercent: 0.3,
        championActivityScore: 90,
        anomalyCount30d: 15,
      }

      const result = service.compute(input)

      expect(result.recommendations.some(r => r.includes('异常事件'))).toBe(true)
      expect(result.status).toBe('HEALTHY')
    })

    // 反例: score 75 (WARNING 范围内)
    it('should return WARNING for mid-range score', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-midrange',
        p95Ms: 100,         // perf=100
        errorRate: 0.005,   // rel=90
        quotaUsagePercent: 0.85, // quota=50
        championActivityScore: 40, // comm=40
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      // 100*0.3=30, 90*0.3=27, 50*0.2=10, 40*0.2=8 → 75
      expect(result.score).toBe(75)
      expect(result.status).toBe('WARNING')
    })

    // 反例: score 恰好 60 边界
    it('should return WARNING when score is in 60-79 range', () => {
      // errorRate 0.01 is NOT < 0.01, falls to <0.05 → 50
      // Use errorRate=0.009 to get rel=75
      const input: TenantHealthInput = {
        tenantId: 'store-exact-60',
        p95Ms: 400,        // perf=70 (s.b. <500)
        errorRate: 0.009,  // <0.01 → rel=75
        quotaUsagePercent: 0.8, // NOT <0.8, falls to <0.9 → 50
        championActivityScore: 40, // comm=40
        anomalyCount30d: 0,
      }

      const result = service.compute(input)

      // 70*0.3=21, 75*0.3=22.5, 50*0.2=10, 40*0.2=8 → 61.5 → 62
      expect(result.score).toBeGreaterThanOrEqual(60)
      expect(result.score).toBeLessThan(80)
      expect(result.status).toBe('WARNING')
    })

    // 边界: 所有组件分数都最低 — 极端值时
    it('should handle extreme values gracefully', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-extreme',
        p95Ms: 99999,
        errorRate: 0.999,
        quotaUsagePercent: 2.0,
        championActivityScore: 0,
        anomalyCount30d: 999,
      }

      const result = service.compute(input)

      // perf=10*0.3=3, rel=10*0.3=3, quota=10*0.2=2, comm=20*0.2=4 → 12
      expect(result.score).toBe(12)
      expect(result.status).toBe('CRITICAL')
      expect(result.recommendations.every(r => r !== '健康度良好,继续保持')).toBe(true)
    })

    // 反例: 各方面都中等
    it('should correctly score moderate metrics', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-moderate',
        p95Ms: 500,         // <=500 → perf=70
        errorRate: 0.03,    // <0.05 → rel=50
        quotaUsagePercent: 0.85, // <0.9 → quota=50
        championActivityScore: 20, // >=20 → comm=60
        anomalyCount30d: 8,
      }

      const result = service.compute(input)

      // perf=70*0.3=21, rel=50*0.3=15, quota=50*0.2=10, comm=60*0.2=12 → 58
      expect(result.score).toBe(58)
      expect(result.status).toBe('CRITICAL')
    })
  })

  // ── computeBatch ──
  describe('computeBatch', () => {
    it('should return scores sorted ascending (worst first)', () => {
      const storeA: TenantHealthInput = {
        tenantId: 'store-good',
        p95Ms: 50,
        errorRate: 0.0005,
        quotaUsagePercent: 0.3,
        championActivityScore: 90,
        anomalyCount30d: 0,
      }
      const storeB: TenantHealthInput = {
        tenantId: 'store-bad',
        p95Ms: 5000,
        errorRate: 0.3,
        quotaUsagePercent: 1.5,
        championActivityScore: 0,
        anomalyCount30d: 40,
      }

      const results = service.computeBatch([storeA, storeB])

      expect(results).toHaveLength(2)
      // Worst first
      expect(results[0].tenantId).toBe('store-bad')
      expect(results[1].tenantId).toBe('store-good')
      expect(results[0].score).toBeLessThan(results[1].score)
    })

    it('should handle empty input', () => {
      const results = service.computeBatch([])
      expect(results).toHaveLength(0)
    })

    it('should handle single tenant', () => {
      const input: TenantHealthInput = {
        tenantId: 'store-solo',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.5,
        championActivityScore: 50,
        anomalyCount30d: 0,
      }

      const results = service.computeBatch([input])

      expect(results).toHaveLength(1)
      expect(results[0].tenantId).toBe('store-solo')
    })

    it('should handle many tenants and maintain correct ordering', () => {
      const inputs: TenantHealthInput[] = Array.from({ length: 10 }, (_, i) => ({
        tenantId: `store-${i}`,
        p95Ms: 100 + i * 500,
        errorRate: 0.001 + i * 0.01,
        quotaUsagePercent: 0.3 + i * 0.07,
        championActivityScore: Math.max(0, 90 - i * 10),
        anomalyCount30d: i * 5,
      }))

      const results = service.computeBatch(inputs)

      expect(results).toHaveLength(10)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeLessThanOrEqual(results[i].score)
      }
    })
  })
})
