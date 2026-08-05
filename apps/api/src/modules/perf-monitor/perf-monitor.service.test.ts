/**
 * perf-monitor.service.spec.ts
 * 🐜 纯函数式内联测试 — 不import生产代码
 * Phase-FP P0 · 2026-07-08
 *
 * 核心业务逻辑：百分位数计算 (P50/P95/P99)、错误率、
 * SLA违规检测、慢查询过滤、统计摘要
 */

// ============================================================
// 1. 枚举 + 类型定义
// ============================================================

interface PerfSample {
  route: string
  durationMs: number
  statusCode: number
  timestamp: string
  tenantId?: string
}

interface PerfStats {
  route: string
  p50: number
  p95: number
  p99: number
  max: number
  count: number
  errorRate: number
}

interface SlaConfig {
  route: string
  targetP95Ms: number
  warnThresholdP95Ms: number
}

interface PerfSummary {
  totalSamples: number
  routes: number
  slowQueries: number
  slaViolations: number
}

// ============================================================
// 2. Mock 数据工厂
// ============================================================

function makeSample(overrides: Partial<PerfSample> = {}): PerfSample {
  return {
    route: '/api/test',
    durationMs: 100,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

function makeSla(overrides: Partial<SlaConfig> = {}): SlaConfig {
  return {
    route: '/api/test',
    targetP95Ms: 200,
    warnThresholdP95Ms: 250,
    ...overrides,
  }
}

// ============================================================
// 3. 内联业务逻辑纯函数
// ============================================================

/**
 * 计算百分位数 (纯函数)
 * p 范围 [0, 1]，如 0.5 = P50, 0.95 = P95
 */
function percentile(durations: number[], p: number): number {
  if (durations.length === 0) return 0
  const sorted = [...durations].sort((a, b) => a - b)
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1)
  return sorted[idx]
}

/**
 * 计算单路由的性能统计 (纯函数)
 */
function computeRouteStats(route: string, samples: PerfSample[]): PerfStats {
  const routeSamples = samples.filter(s => s.route === route)
  if (routeSamples.length === 0) {
    return { route, p50: 0, p95: 0, p99: 0, max: 0, count: 0, errorRate: 0 }
  }
  const errorCount = routeSamples.filter(s => s.statusCode >= 400).length
  const durs = routeSamples.map(s => s.durationMs)
  const sorted = [...durs].sort((a, b) => a - b)
  return {
    route,
    p50: percentile(durs, 0.5),
    p95: percentile(durs, 0.95),
    p99: percentile(durs, 0.99),
    max: sorted[sorted.length - 1],
    count: routeSamples.length,
    errorRate: errorCount / routeSamples.length,
  }
}

/**
 * 获取所有路由的统计 (纯函数)
 */
function computeAllRouteStats(samples: PerfSample[]): PerfStats[] {
  const routes = new Set(samples.map(s => s.route))
  return Array.from(routes).map(r => computeRouteStats(r, samples))
}

/**
 * 过滤慢查询 (> 500ms) (纯函数)
 */
function filterSlowQueries(samples: PerfSample[], limit: number = 20): PerfSample[] {
  const slow = samples.filter(s => s.durationMs > 500)
  // slice(-0) 返回整个数组，所以需处理 limit <= 0
  if (limit <= 0) return []
  return slow.slice(-limit)
}

/**
 * 检测 SLA 违规 (纯函数)
 * 对每次采样计算路由 P95，若超过 warnThresholdP95Ms 则视为一次违规
 * 返回 { violationsByRoute: Map<route, count>, violatedRoutes: Set<route> }
 */
interface SlaViolationResult {
  violationsByRoute: Map<string, number>
  violatedRoutes: string[]
}

function detectSlaViolations(
  samples: PerfSample[],
  slaConfigs: Map<string, SlaConfig>,
): SlaViolationResult {
  const violationsByRoute = new Map<string, number>()
  const violatedRoutes = new Set<string>()

  for (const [route, sla] of slaConfigs.entries()) {
    const stats = computeRouteStats(route, samples)
    if (stats.p95 > sla.warnThresholdP95Ms) {
      // 每条记录都触发一次计数
      const routeSamples = samples.filter(s => s.route === route)
      for (const _s of routeSamples) {
        if (_s.durationMs > sla.warnThresholdP95Ms) {
          violationsByRoute.set(route, (violationsByRoute.get(route) ?? 0) + 1)
          violatedRoutes.add(route)
        }
      }
    }
  }

  return {
    violationsByRoute,
    violatedRoutes: Array.from(violatedRoutes),
  }
}

/**
 * 计算限长样本池 (滑动窗口 FIFO 截断) (纯函数)
 * 模拟内存样本池行为: 超出 max 时丢弃最早的元素
 */
function trimToMax<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items
  return items.slice(items.length - max)
}

/**
 * 计算统计摘要 (纯函数)
 */
function computeSummary(samples: PerfSample[], slowQueries: PerfSample[], slaViolations: number): PerfSummary {
  return {
    totalSamples: samples.length,
    routes: new Set(samples.map(s => s.route)).size,
    slowQueries: slowQueries.length,
    slaViolations,
  }
}

/**
 * 过滤限长慢查询列表 (纯函数)
 */
function getSlowQueries(slowQueries: PerfSample[], limit: number = 20): PerfSample[] {
  return slowQueries.slice(-limit)
}

/**
 * SLA 违规排序 (纯函数)
 */
interface SlaViolationEntry {
  route: string
  violations: number
  stats: PerfStats
}

function getSortedSlaViolations(
  samples: PerfSample[],
  slaConfigs: Map<string, SlaConfig>,
): SlaViolationEntry[] {
  const result: SlaViolationEntry[] = []
  for (const [route, _sla] of slaConfigs.entries()) {
    const stats = computeRouteStats(route, samples)
    const routeSamples = samples.filter(s => s.route === route)
    let violations = 0
    for (const s of routeSamples) {
      if (s.durationMs > _sla.warnThresholdP95Ms) violations++
    }
    if (violations > 0) {
      result.push({ route, violations, stats })
    }
  }
  return result.sort((a, b) => b.violations - a.violations)
}

// ============================================================
// 4. 测试用例
// ============================================================

import { describe, it, expect } from 'vitest'

describe('🧪 perf-monitor — 纯函数性能监控', () => {
  // ============================================================
  // 正例 8+
  // ============================================================
  describe('✅ 正例 — percentile', () => {
    it('空数组返回 0', () => {
      expect(percentile([], 0.5)).toBe(0)
    })
    it('P50 对 1-100 精确', () => {
      const arr = Array.from({ length: 100 }, (_, i) => i + 1)
      // idx = floor(100 * 0.5) = 50 → sorted[50] = 51
      expect(percentile(arr, 0.5)).toBe(51)
    })
    it('P95 对 1-100 精确', () => {
      const arr = Array.from({ length: 100 }, (_, i) => i + 1)
      // idx = floor(100 * 0.95) = 95 → sorted[95] = 96
      expect(percentile(arr, 0.95)).toBe(96)
    })
    it('P99 对 1-100 精确', () => {
      const arr = Array.from({ length: 100 }, (_, i) => i + 1)
      // idx = floor(100 * 0.99) = 99 → sorted[99] = 100
      expect(percentile(arr, 0.99)).toBe(100)
    })
    it('P50 对奇数个数', () => {
      const arr = [1, 2, 3, 4, 5]
      // idx = floor(5 * 0.5) = 2 → sorted[2] = 3
      expect(percentile(arr, 0.5)).toBe(3)
    })
    it('P95 = P99 = max 对 1 个元素', () => {
      expect(percentile([42], 0.5)).toBe(42)
      expect(percentile([42], 0.95)).toBe(42)
      expect(percentile([42], 0.99)).toBe(42)
    })
  })

  describe('✅ 正例 — computeRouteStats', () => {
    it('无采样返回零', () => {
      const stats = computeRouteStats('/api/none', [])
      expect(stats.count).toBe(0)
      expect(stats.p95).toBe(0)
      expect(stats.errorRate).toBe(0)
    })
    it('单个采样所有分位等于该值', () => {
      const samples = [makeSample({ route: '/api/single', durationMs: 55 })]
      const stats = computeRouteStats('/api/single', samples)
      expect(stats.count).toBe(1)
      expect(stats.p50).toBe(55)
      expect(stats.p95).toBe(55)
      expect(stats.p99).toBe(55)
      expect(stats.max).toBe(55)
    })
    it('多个采样正确计算（含错误率）', () => {
      const samples = [
        makeSample({ route: '/api/r1', durationMs: 10, statusCode: 200 }),
        makeSample({ route: '/api/r1', durationMs: 20, statusCode: 200 }),
        makeSample({ route: '/api/r1', durationMs: 30, statusCode: 500 }),
        makeSample({ route: '/api/r1', durationMs: 40, statusCode: 200 }),
      ]
      const stats = computeRouteStats('/api/r1', samples)
      expect(stats.count).toBe(4)
      // sorted=[10,20,30,40]; idx=floor(4*0.5)=2 → sorted[2]=30
      expect(stats.p50).toBe(30)
      // idx=floor(4*0.95)=3 → sorted[3]=40
      expect(stats.p95).toBe(40)
      // idx=floor(4*0.99)=3 → sorted[3]=40
      expect(stats.p99).toBe(40)
      expect(stats.max).toBe(40)
      expect(stats.errorRate).toBeCloseTo(0.25)
    })
  })

  describe('✅ 正例 — computeAllRouteStats', () => {
    it('无采样返回空数组', () => {
      expect(computeAllRouteStats([])).toEqual([])
    })
    it('返回所有唯一路由的统计', () => {
      const samples = [
        makeSample({ route: '/api/a', durationMs: 10 }),
        makeSample({ route: '/api/b', durationMs: 20 }),
        makeSample({ route: '/api/a', durationMs: 30 }),
      ]
      const all = computeAllRouteStats(samples)
      expect(all).toHaveLength(2)
      const a = all.find(s => s.route === '/api/a')
      expect(a?.count).toBe(2)
    })
  })

  describe('✅ 正例 — filterSlowQueries', () => {
    it('过滤出 > 500ms 的采样', () => {
      const samples = [
        makeSample({ durationMs: 100 }),
        makeSample({ durationMs: 600 }),
        makeSample({ durationMs: 300 }),
        makeSample({ durationMs: 1000 }),
      ]
      const slow = filterSlowQueries(samples, 10)
      expect(slow).toHaveLength(2)
      expect(slow.every(s => s.durationMs > 500)).toBe(true)
    })
    it('limit 参数生效', () => {
      const samples = Array.from({ length: 50 }, (_, i) => makeSample({ durationMs: 600 + i }))
      expect(filterSlowQueries(samples, 10)).toHaveLength(10)
    })
  })

  describe('✅ 正例 — detectSlaViolations', () => {
    it('P95 超阈值检测到违规', () => {
      const slaConfigs = new Map<string, SlaConfig>()
      slaConfigs.set('/api/slow', { route: '/api/slow', targetP95Ms: 100, warnThresholdP95Ms: 120 })
      const samples = Array.from({ length: 20 }, (_, i) =>
        makeSample({ route: '/api/slow', durationMs: 200 + i * 10, statusCode: 200 }),
      )
      const result = detectSlaViolations(samples, slaConfigs)
      expect(result.violatedRoutes).toContain('/api/slow')
      expect(result.violationsByRoute.get('/api/slow')! > 0).toBe(true)
    })
    it('P95 未超阈值无违规', () => {
      const slaConfigs = new Map<string, SlaConfig>()
      slaConfigs.set('/api/fast', { route: '/api/fast', targetP95Ms: 500, warnThresholdP95Ms: 400 })
      const samples = Array.from({ length: 20 }, (_, i) =>
        makeSample({ route: '/api/fast', durationMs: 10 + i, statusCode: 200 }),
      )
      const result = detectSlaViolations(samples, slaConfigs)
      expect(result.violatedRoutes).not.toContain('/api/fast')
    })
  })

  describe('✅ 正例 — computeSummary', () => {
    it('正确反映状态', () => {
      const samples = [
        makeSample({ route: '/api/a' }),
        makeSample({ route: '/api/b' }),
        makeSample({ route: '/api/b' }),
      ]
      const slow = [makeSample({ durationMs: 600 }), makeSample({ durationMs: 700 })]
      const summary = computeSummary(samples, slow, 3)
      expect(summary.totalSamples).toBe(3)
      expect(summary.routes).toBe(2)
      expect(summary.slowQueries).toBe(2)
      expect(summary.slaViolations).toBe(3)
    })
  })

  // ============================================================
  // 反例 5+
  // ============================================================
  describe('❌ 反例 — computeRouteStats', () => {
    it('完全不相关路由返回零', () => {
      const samples = [makeSample({ route: '/api/other' })]
      const stats = computeRouteStats('/api/target', samples)
      expect(stats.count).toBe(0)
      expect(stats.p50).toBe(0)
    })
    it('全部错误时 errorRate = 1', () => {
      const samples = [
        makeSample({ statusCode: 500 }),
        makeSample({ statusCode: 503 }),
      ]
      const stats = computeRouteStats('/api/test', samples)
      expect(stats.errorRate).toBe(1)
    })
  })

  describe('❌ 反例 — filterSlowQueries', () => {
    it('无慢查询返回空', () => {
      const samples = [makeSample({ durationMs: 10 }), makeSample({ durationMs: 100 })]
      expect(filterSlowQueries(samples, 10)).toEqual([])
    })
    it('limit 为 0 返回空', () => {
      const samples = [makeSample({ durationMs: 1000 })]
      expect(filterSlowQueries(samples, 0)).toEqual([])
    })
  })

  describe('❌ 反例 — detectSlaViolations', () => {
    it('未注册 SLA 的路由无违规', () => {
      const slaConfigs = new Map<string, SlaConfig>()
      const samples = [makeSample({ route: '/api/unregistered', durationMs: 9999 })]
      const result = detectSlaViolations(samples, slaConfigs)
      expect(result.violatedRoutes).toHaveLength(0)
    })
    it('阈值极高时无违规', () => {
      const slaConfigs = new Map<string, SlaConfig>()
      slaConfigs.set('/api/test', { route: '/api/test', targetP95Ms: 10000, warnThresholdP95Ms: 50000 })
      const samples = [makeSample({ durationMs: 100 })]
      const result = detectSlaViolations(samples, slaConfigs)
      expect(result.violatedRoutes).toHaveLength(0)
    })
  })

  // ============================================================
  // 边界 5+
  // ============================================================
  describe('🔲 边界 — percentile', () => {
    it('P = 0 返回最小值', () => {
      const arr = [5, 3, 1, 4, 2]
      // idx = floor(5*0) = 0 → sorted[0] = 1
      expect(percentile(arr, 0)).toBe(1)
    })
    it('P = 1 返回最大值', () => {
      const arr = [5, 3, 1, 4, 2]
      // idx = min(floor(5*1), 4) = 4 → sorted[4] = 5
      expect(percentile(arr, 1)).toBe(5)
    })
    it('两个值: P50 = last (floor(2*0.5)=1)', () => {
      expect(percentile([10, 100], 0.5)).toBe(100)
    })
    it('大集合确保精度', () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i + 1)
      expect(percentile(arr, 0.5)).toBe(501) // floor(1000*0.5) = 500 → sorted[500] = 501
      expect(percentile(arr, 0.95)).toBe(951) // floor(1000*0.95) = 950 → sorted[950] = 951
    })
  })

  describe('🔲 边界 — computeRouteStats', () => {
    it('同一路由不同状态码正确统计', () => {
      const samples = [
        makeSample({ route: '/api/mix', durationMs: 100, statusCode: 200 }),
        makeSample({ route: '/api/mix', durationMs: 200, statusCode: 200 }),
        makeSample({ route: '/api/mix', durationMs: 300, statusCode: 500 }),
      ]
      const stats = computeRouteStats('/api/mix', samples)
      expect(stats.count).toBe(3)
      expect(stats.p50).toBe(200)
      expect(stats.errorRate).toBeCloseTo(1 / 3)
    })
  })

  describe('🔲 边界 — getSortedSlaViolations', () => {
    it('多个违规按次数降序', () => {
      const slaConfigs = new Map<string, SlaConfig>()
      slaConfigs.set('/api/hot', { route: '/api/hot', targetP95Ms: 50, warnThresholdP95Ms: 60 })
      slaConfigs.set('/api/warm', { route: '/api/warm', targetP95Ms: 50, warnThresholdP95Ms: 60 })
      const samples = [
        ...Array.from({ length: 10 }, (_, i) => makeSample({ route: '/api/hot', durationMs: 200 + i, statusCode: 200 })),
        ...Array.from({ length: 3 }, (_, i) => makeSample({ route: '/api/warm', durationMs: 100 + i, statusCode: 200 })),
      ]
      const result = getSortedSlaViolations(samples, slaConfigs)
      expect(result.length).toBeGreaterThanOrEqual(2)
      // 按降序
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].violations).toBeGreaterThanOrEqual(result[i].violations)
      }
    })
  })

  describe('🔲 边界 — trimToMax', () => {
    it('不满 max 不截断', () => {
      expect(trimToMax([1, 2, 3], 10)).toEqual([1, 2, 3])
    })
    it('超出 max 截取尾部', () => {
      expect(trimToMax([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5])
    })
    it('limit=0 返回空', () => {
      expect(trimToMax([1, 2, 3], 0)).toEqual([])
    })
  })

  describe('🔲 边界 — getSlowQueries', () => {
    it('limit 大于池大小返回全部', () => {
      const slow = [makeSample({ durationMs: 600 }), makeSample({ durationMs: 700 })]
      expect(getSlowQueries(slow, 100)).toHaveLength(2)
    })
    it('空池返回空', () => {
      expect(getSlowQueries([], 20)).toEqual([])
    })
  })
})
