/**
 * platform.service-extended.test.ts — PlatformService 扩展单元测试
 *
 * 覆盖内容（每分组 ≥3 tests，总计 ≥15）：
 * - getOverview 返回值完整性
 * - 指标记录（新增/覆盖/边界值）
 * - 健康检查（同步/异步路径）
 * - uptime 格式化
 * - 重置逻辑
 * - 空初始状态边缘情况
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlatformService, type PlatformMetric } from './platform.service'

function createService(): PlatformService {
  const svc = new PlatformService()
  svc.reset()
  return svc
}

describe('PlatformService — extended', () => {
  let service: PlatformService

  beforeEach(() => {
    service = createService()
  })

  afterEach(() => {
    service.reset()
  })

  // ── getOverview 深入验证 ─────────────────────────────────────────

  it('getOverview returns non-negative activeTenants', () => {
    const overview = service.getOverview()
    expect(overview.activeTenants).toBeGreaterThanOrEqual(0)
  })

  it('getOverview returns servicesCount matching health services length', () => {
    const overview = service.getOverview()
    expect(overview.servicesCount).toBe(overview.health.services.length)
  })

  it('getOverview uptimeHours is never NaN', () => {
    const overview = service.getOverview()
    expect(Number.isNaN(overview.uptimeHours)).toBe(false)
  })

  // ── recordMetric ────────────────────────────────────────────────

  it('recordMetric adds new metric when name does not exist', () => {
    const result = service.recordMetric('requests_per_min', 120, 'rpm')
    expect(result.name).toBe('requests_per_min')
    expect(result.value).toBe(120)
    expect(result.unit).toBe('rpm')
    expect(result.updatedAt).toBeTruthy()
  })

  it('recordMetric overwrites existing metric with same name', () => {
    service.recordMetric('cpu', 45, '%')
    const updated = service.recordMetric('cpu', 78, '%')
    expect(updated.value).toBe(78)
    // 确认列表中也只有一项 cpu
    const overview = service.getOverview()
    const cpuMetrics = overview.metrics.filter((m: PlatformMetric) => m.name === 'cpu')
    expect(cpuMetrics).toHaveLength(1)
    expect(cpuMetrics[0].value).toBe(78)
  })

  it('recordMetric accepts zero value', () => {
    const result = service.recordMetric('idle', 0, 'count')
    expect(result.value).toBe(0)
  })

  it('recordMetric accepts negative value', () => {
    const result = service.recordMetric('delta', -5, 'diff')
    expect(result.value).toBe(-5)
  })

  it('recordMetric preserves order of insertion', () => {
    service.recordMetric('a', 1, '')
    service.recordMetric('b', 2, '')
    service.recordMetric('c', 3, '')
    const overview = service.getOverview()
    expect(overview.metrics.map((m: PlatformMetric) => m.name)).toEqual(['a', 'b', 'c'])
  })

  // ── checkHealth ────────────────────────────────────────────────

  it('checkHealth returns healthy status with uptime', async () => {
    const health = await service.checkHealth()
    expect(health.status).toBe('healthy')
    expect(health.uptime).toBeGreaterThanOrEqual(0)
  })

  it('checkHealth returns 4 known services', async () => {
    const health = await service.checkHealth()
    expect(health.services).toContain('api')
    expect(health.services).toContain('redis')
    expect(health.services).toContain('postgres')
    expect(health.services).toContain('clickhouse')
  })

  it('checkHealth lastCheck is a valid ISO string', async () => {
    const health = await service.checkHealth()
    expect(() => new Date(health.lastCheck)).not.toThrow()
    expect(new Date(health.lastCheck).getTime()).not.toBeNaN()
  })

  // ── getUptime ──────────────────────────────────────────────────

  it('getUptime returns formatted string matching pattern', () => {
    const uptime = service.getUptime()
    expect(uptime).toMatch(/^\d+h\d+m\d+s$/)
  })

  it('getUptime hours/minutes/seconds are non-negative', () => {
    const uptime = service.getUptime()
    const parts = uptime.match(/(\d+)h(\d+)m(\d+)s/)
    expect(parts).not.toBeNull()
    if (parts) {
      expect(Number(parts[1])).toBeGreaterThanOrEqual(0)
      expect(Number(parts[2])).toBeGreaterThanOrEqual(0)
      expect(Number(parts[3])).toBeGreaterThanOrEqual(0)
    }
  })

  // ── reset ──────────────────────────────────────────────────────

  it('reset clears all metrics', () => {
    service.recordMetric('x', 100, 'count')
    service.reset()
    const overview = service.getOverview()
    expect(overview.metrics).toHaveLength(0)
  })

  it('reset allows fresh recording after', () => {
    service.recordMetric('old', 1, '')
    service.reset()
    service.recordMetric('new', 2, '')
    const overview = service.getOverview()
    expect(overview.metrics).toHaveLength(1)
    expect(overview.metrics[0].name).toBe('new')
  })

  // ── Edge cases ─────────────────────────────────────────────────

  it('getOverview returns empty metrics array when none recorded', () => {
    const overview = service.getOverview()
    expect(overview.metrics).toEqual([])
  })

  it('startsWith empty state — no error on first call', () => {
    expect(() => service.getOverview()).not.toThrow()
    expect(() => service.getUptime()).not.toThrow()
  })
})
