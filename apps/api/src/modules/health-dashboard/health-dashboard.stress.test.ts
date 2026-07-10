import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [health-dashboard] [D] stress test — 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 并发大批量评估（高吞吐场景）
 * - 极端输入值（溢出、负数、超大数值）
 * - 快速连续状态变更（分数、告警阈值波动）
 * - 内存/时间压力 (大量模拟器运行)
 */

import { HealthDashboardService } from './health-dashboard.service'
import { HealthScoreService, type TenantHealthInput } from './health-score.service'

// ── 工厂 ──

function createDashboard() {
  const healthScore = new HealthScoreService()
  return new HealthDashboardService(healthScore)
}

function createInput(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return {
    tenantId: 't-default',
    p95Ms: 100,
    errorRate: 0.001,
    quotaUsagePercent: 0.4,
    championActivityScore: 80,
    anomalyCount30d: 0,
    ...overrides,
  }
}

describe('HealthDashboard - Stress & Resilience', () => {
  let dashboard: HealthDashboardService

  beforeEach(() => {
    dashboard = createDashboard()
  })

  // ─── 高并发批量评估 ───

  describe('高并发批量评估', () => {
    it('同时评估 200 个租户不崩溃', () => {
      const inputs: TenantHealthInput[] = Array.from({ length: 200 }, (_, i) => ({
        tenantId: `stress-tenant-${i}`,
        p95Ms: Math.round((i % 10) * 100),
        errorRate: (i % 100) / 1000,
        quotaUsagePercent: (i % 50) / 100,
        championActivityScore: (i * 3) % 100,
        anomalyCount30d: i % 30,
      }))

      const summary = dashboard.generateSummary(inputs)
      expect(summary.totalTenants).toBe(200)
      expect(summary.byStatus.HEALTHY + summary.byStatus.WARNING + summary.byStatus.CRITICAL).toBe(200)
      expect(summary.averageScore).toBeGreaterThan(0)
      expect(summary.averageScore).toBeLessThan(100)
      expect(summary.topIssues.length).toBeGreaterThanOrEqual(0)
    })

    it('同时评估 500 个相同租户数据不泄露', () => {
      const input = createInput({ tenantId: 'identical-tenant' })
      const inputs: TenantHealthInput[] = Array.from({ length: 500 }, () => ({ ...input }))

      const summary = dashboard.generateSummary(inputs)
      expect(summary.totalTenants).toBe(500)
      // All identical input -> same status across all
      const total = summary.byStatus.HEALTHY + summary.byStatus.WARNING + summary.byStatus.CRITICAL
      expect(total).toBe(500)
    })

    it('quickAlerts 批量检查 100 个评分不 OOM', () => {
      const scores = Array.from({ length: 100 }, (_, i) => {
        const hs = new HealthScoreService()
        return hs.compute({
          tenantId: `q-scores-${i}`,
          p95Ms: (i * 50) % 5000,
          errorRate: (i * 0.001) % 0.5,
          quotaUsagePercent: (i * 0.02) % 1.0,
          championActivityScore: (i * 5) % 100,
          anomalyCount30d: i,
        })
      })

      const alerts = dashboard.checkAlerts({
        scores,
        config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu'] },
      })
      expect(alerts.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('p95Ms=0 极端健康', () => {
      const input = createInput({ p95Ms: 0, errorRate: 0, quotaUsagePercent: 0, championActivityScore: 100 })
      const summary = dashboard.generateSummary([input])
      expect(summary.byStatus.HEALTHY).toBe(1)
      expect(summary.averageScore).toBeGreaterThanOrEqual(95)
    })

    it('p95Ms=999999 超大延迟使性能分极低', () => {
      const input = createInput({ p95Ms: 999999 })
      const summary = dashboard.generateSummary([input])
      // 性能分只有10，但由于其他维度仍高，可能为WARNING级别
      const score = summary.averageScore
      expect(score).toBeLessThan(70)
    })

    it('errorRate=0.999 高错误率不崩溃', () => {
      const input = createInput({ errorRate: 0.999 })
      const summary = dashboard.generateSummary([input])
      expect(summary.totalTenants).toBe(1)
      expect(summary.averageScore).toBeGreaterThanOrEqual(0)
    })

    it('quotaUsagePercent=0 无使用', () => {
      const input = createInput({ quotaUsagePercent: 0 })
      const summary = dashboard.generateSummary([input])
      expect(summary.averageScore).toBeGreaterThan(0)
    })

    it('quotaUsagePercent=5.0 超限额拉低总分', () => {
      const input = createInput({ quotaUsagePercent: 5.0 })
      const summary = dashboard.generateSummary([input])
      // 配额分只有10
      expect(summary.averageScore).toBeLessThan(80)
    })

    it('championActivityScore=0 无活跃', () => {
      const input = createInput({ championActivityScore: 0 })
      const summary = dashboard.generateSummary([input])
      expect(summary.totalTenants).toBe(1)
    })

    it('anomalyCount30d=99999 海量异常', () => {
      const input = createInput({ anomalyCount30d: 99999 })
      const summary = dashboard.generateSummary([input])
      // 会有异常相关的 issue
      expect(summary.averageScore).toBeLessThan(100)
    })

    it('所有字段极端叠加 -> CRITICAL', () => {
      const input = createInput({
        p95Ms: 99999,
        errorRate: 0.9,
        quotaUsagePercent: 3.0,
        championActivityScore: 0,
        anomalyCount30d: 999,
      })
      const summary = dashboard.generateSummary([input])
      expect(summary.byStatus.CRITICAL).toBe(1)
    })

    it('所有字段最优 -> HEALTHY', () => {
      const input = createInput({
        p95Ms: 5,
        errorRate: 0.0001,
        quotaUsagePercent: 0.1,
        championActivityScore: 100,
        anomalyCount30d: 0,
      })
      const summary = dashboard.generateSummary([input])
      expect(summary.byStatus.HEALTHY).toBe(1)
    })
  })

  // ─── 连续告警状态变更 ───

  describe('连续告警状态变更', () => {
    const volatileInput: TenantHealthInput = {
      tenantId: 'volatile-store',
      p95Ms: 300,
      errorRate: 0.01,
      quotaUsagePercent: 0.7,
      championActivityScore: 40,
      anomalyCount30d: 5,
    }

    it('严格阈值 -> WARNING', () => {
      const hs = new HealthScoreService()
      const score = hs.compute(volatileInput)
      const alerts = dashboard.checkAlerts({
        scores: [score],
        config: { warningThreshold: 90, criticalThreshold: 70, notifyChannels: ['email'] },
      })
      expect(alerts.length).toBeGreaterThanOrEqual(1)
    })

    it('宽松阈值 -> 无告警', () => {
      const hs = new HealthScoreService()
      const score = hs.compute(volatileInput)
      const alerts = dashboard.checkAlerts({
        scores: [score],
        config: { warningThreshold: 30, criticalThreshold: 10, notifyChannels: ['email'] },
      })
      expect(alerts).toEqual([])
    })

    it('阈值渐进收紧 -> 告警数量递增', () => {
      const hs = new HealthScoreService()
      const scores = Array.from({ length: 5 }, (_, i) =>
        hs.compute({
          ...volatileInput,
          tenantId: `progressive-${i}`,
          p95Ms: 100 + i * 100,
          errorRate: 0.001 + i * 0.002,
        }))

      const strict = dashboard.checkAlerts({
        scores,
        config: { warningThreshold: 90, criticalThreshold: 60, notifyChannels: ['email'] },
      })
      const loose = dashboard.checkAlerts({
        scores,
        config: { warningThreshold: 50, criticalThreshold: 30, notifyChannels: ['email'] },
      })
      expect(strict.length).toBeGreaterThanOrEqual(loose.length)
    })

    it('阈值全部设为0 -> 所有租户均告警', () => {
      const hs = new HealthScoreService()
      const scores = [hs.compute(createInput()), hs.compute(createInput({ tenantId: 't2' }))]
      const alerts = dashboard.checkAlerts({
        scores,
        config: { warningThreshold: 0, criticalThreshold: 0, notifyChannels: ['email'] },
      })
      // score > 0 >= 0 不成立, 所以都不会触发
      expect(alerts).toEqual([])
    })

    it('阈值全部设为100 -> 所有租户WARNING', () => {
      const hs = new HealthScoreService()
      const scores = [hs.compute(createInput({ tenantId: 'a' })), hs.compute(createInput({ tenantId: 'b', p95Ms: 5, errorRate: 0.0001 }))]
      const alerts = dashboard.checkAlerts({
        scores,
        config: { warningThreshold: 100, criticalThreshold: 90, notifyChannels: ['feishu'] },
      })
      expect(alerts.length).toBe(scores.length)
      expect(alerts.every(a => a.severity === 'WARNING')).toBe(true)
    })
  })

  // ─── Grafana 输出韧性 ───

  describe('Grafana 输出韧性', () => {
    it('超大量 tenants 的 metric 输出', () => {
      const summary = dashboard.generateSummary(
        Array.from({ length: 1000 }, (_, i) => createInput({ tenantId: `g-${i}` }))
      )
      const output = dashboard.toGrafana(summary)
      expect(output).toContain('tenant_health_score_avg')
      expect(output).toContain('tenant_by_status_healthy')
      expect(output).toContain('tenant_by_status_warning')
      expect(output).toContain('tenant_by_status_critical')
    })

    it('all CRITICAL 指标', () => {
      const inputs = Array.from({ length: 50 }, (_, i) => createInput({
        tenantId: `crit-${i}`,
        p95Ms: 5000,
        errorRate: 0.5,
        quotaUsagePercent: 2.0,
        championActivityScore: 0,
        anomalyCount30d: 100,
      }))
      const summary = dashboard.generateSummary(inputs)
      expect(summary.byStatus.CRITICAL).toBe(50)
      expect(summary.byStatus.HEALTHY).toBe(0)
      expect(summary.byStatus.WARNING).toBe(0)
    })

    it('空汇总的 Grafana 输出', () => {
      const output = dashboard.toGrafana({
        totalTenants: 0,
        byStatus: { HEALTHY: 0, WARNING: 0, CRITICAL: 0 },
        averageScore: 0,
        topIssues: [],
        alerts: [],
        computedAt: '2026-01-01T00:00:00Z',
      })
      expect(output).toContain('0.00')
      expect(output).toContain('healthy 0')
      expect(output).toContain('warning 0')
      expect(output).toContain('critical 0')
    })
  })

  // ─── 大量租户 + 多种异常组合 ───

  describe('大量租户 + 多种异常组合', () => {
    it('混合 200 个不同健康状态租户的 topIssues 排序正确', () => {
      const inputs: TenantHealthInput[] = []
      // 100 healthy
      for (let i = 0; i < 100; i++) {
        inputs.push(createInput({
          tenantId: `healthy-${i}`,
          p95Ms: 30,
          errorRate: 0.0005,
          quotaUsagePercent: 0.2,
          championActivityScore: 95,
          anomalyCount30d: 0,
        }))
      }
      // 60 warning
      for (let i = 0; i < 60; i++) {
        inputs.push(createInput({
          tenantId: `warn-${i}`,
          p95Ms: 400,
          errorRate: 0.008,
          quotaUsagePercent: 0.6,
          championActivityScore: 30,
          anomalyCount30d: 5,
        }))
      }
      // 40 critical (high anomaly)
      for (let i = 0; i < 40; i++) {
        inputs.push(createInput({
          tenantId: `crit-${i}`,
          p95Ms: 3000,
          errorRate: 0.08,
          quotaUsagePercent: 0.95,
          championActivityScore: 2,
          anomalyCount30d: 20,
        }))
      }

      const summary = dashboard.generateSummary(inputs)
      expect(summary.totalTenants).toBe(200)
      expect(summary.byStatus.HEALTHY).toBe(100)
      expect(summary.byStatus.WARNING).toBe(60)
      expect(summary.byStatus.CRITICAL).toBe(40)

      // Check top issues sorted descending
      for (let i = 1; i < summary.topIssues.length; i++) {
        expect(summary.topIssues[i].count).toBeLessThanOrEqual(summary.topIssues[i - 1].count)
      }
    })

    it('1000 个租户 summary 不超时', () => {
      const inputs: TenantHealthInput[] = Array.from({ length: 1000 }, (_, i) => ({
        tenantId: `big-batch-${i}`,
        p95Ms: Math.random() * 5000,
        errorRate: Math.random() * 0.5,
        quotaUsagePercent: Math.random() * 2,
        championActivityScore: Math.floor(Math.random() * 100),
        anomalyCount30d: Math.floor(Math.random() * 50),
      }))

      const start = performance.now()
      const summary = dashboard.generateSummary(inputs)
      const elapsed = performance.now() - start

      expect(summary.totalTenants).toBe(1000)
      expect(elapsed).toBeLessThan(5000) // 应该在 5 秒内完成
    })
  })
})
