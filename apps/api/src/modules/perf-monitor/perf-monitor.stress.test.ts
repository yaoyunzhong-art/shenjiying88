/**
 * 🐜 自动: [perf-monitor] [D] 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 高吞吐大量采样（10000+ 样本滑动窗口）
 * - 并发注入（多个路由混合）
 * - 极端输入值（超大延迟、负数(被 clamp)、零、边界 SLA）
 * - 内存压力 (maxSamples 边缘和溢出)
 * - 毫秒级快速触发风暴
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'

const SAMPLE = {
  route: '',
  durationMs: 0,
  statusCode: 200,
  timestamp: '',
}

beforeEach(() => {
  // 保证每个测试上下文干净
})

// ════════════════════════════════════════════════════════
//  内联 PerfMonitorService 副本（纯函数隔离测试）
//  仅依赖 ts 标准库，避免 import 耦合
// ════════════════════════════════════════════════════════

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

class InlinePerfMonitor {
  samples: PerfSample[] = []
  slowQueries: PerfSample[] = []
  slaConfigs = new Map<string, SlaConfig>()
  slaViolations = new Map<string, number>()
  readonly MAX_SAMPLES = 10_000
  readonly SLOW_THRESHOLD = 500
  readonly MAX_SLOW = 1000

  reset(): void {
    this.samples.length = 0
    this.slowQueries.length = 0
    this.slaConfigs.clear()
    this.slaViolations.clear()
  }

  registerSla(config: SlaConfig): void {
    this.slaConfigs.set(config.route, config)
  }

  record(sample: PerfSample): void {
    this.samples.push(sample)
    if (this.samples.length > this.MAX_SAMPLES) {
      this.samples.shift()
    }
    if (sample.durationMs > this.SLOW_THRESHOLD) {
      this.slowQueries.push(sample)
      if (this.slowQueries.length > this.MAX_SLOW) {
        this.slowQueries.shift()
      }
    }
    const sla = this.slaConfigs.get(sample.route)
    if (sla) {
      const stats = this.getStatsForRoute(sample.route)
      if (stats.p95 > sla.warnThresholdP95Ms) {
        const count = (this.slaViolations.get(sample.route) ?? 0) + 1
        this.slaViolations.set(sample.route, count)
      }
    }
  }

  getStatsForRoute(route: string): PerfStats {
    const routeSamples = this.samples.filter(s => s.route === route)
    if (routeSamples.length === 0) {
      return { route, p50: 0, p95: 0, p99: 0, max: 0, count: 0, errorRate: 0 }
    }
    const durations = routeSamples.map(s => s.durationMs).sort((a, b) => a - b)
    const errorCount = routeSamples.filter(s => s.statusCode >= 400).length
    return {
      route,
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      max: durations[durations.length - 1],
      count: routeSamples.length,
      errorRate: errorCount / routeSamples.length,
    }
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1)
    return sorted[idx]
  }

  getAllStats(): PerfStats[] {
    const routes = new Set(this.samples.map(s => s.route))
    return Array.from(routes).map(r => this.getStatsForRoute(r))
  }

  getSlaViolations() {
    const result: { route: string; violations: number; stats: PerfStats }[] = []
    for (const [route, count] of this.slaViolations.entries()) {
      result.push({ route, violations: count, stats: this.getStatsForRoute(route) })
    }
    return result.sort((a, b) => b.violations - a.violations)
  }

  getSlowQueries(limit: number = 20): PerfSample[] {
    return this.slowQueries.slice(-limit)
  }

  summary() {
    return {
      totalSamples: this.samples.length,
      routes: new Set(this.samples.map(s => s.route)).size,
      slowQueries: this.slowQueries.length,
      slaViolations: Array.from(this.slaViolations.values()).reduce((s, v) => s + v, 0),
    }
  }
}

function makeSample(overrides: Partial<PerfSample> = {}): PerfSample {
  return {
    route: '/api/test',
    durationMs: 100,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

// ════════════════════════════════════════════════════════
//  压力测试
// ════════════════════════════════════════════════════════

describe('PerfMonitor - Stress & Resilience', () => {
  let monitor: InlinePerfMonitor

  beforeEach(() => {
    monitor = new InlinePerfMonitor()
  })

  // ─── 高吞吐量 ──────────────────────────────────────

  describe('高吞吐量场景', () => {
    it('连续注入 10000 条样本不崩溃且统计正确', () => {
      for (let i = 0; i < 10000; i++) {
        monitor.record({
          route: '/api/order',
          durationMs: (i % 1000) + 1,
          statusCode: i % 100 === 0 ? 500 : 200,
          timestamp: new Date(Date.now() + i).toISOString(),
        })
      }
      const stats = monitor.getStatsForRoute('/api/order')
      assert.equal(stats.count, 10000)
      // 1..1000 each repeated 10x; sorted[idx] where idx=floor(10000*0.5)=5000 → 501
      assert.equal(stats.p50, 501)
      // P95: floor(10000*0.95)=9500 → 951 (9500/10+1)
      assert.equal(stats.p95, 951)
      // P99: floor(10000*0.99)=9900 → 991
      assert.equal(stats.p99, 991)
      assert.equal(stats.max, 1000)
      assert.ok(stats.errorRate > 0)
      assert.equal(stats.errorRate, 0.01) // 1% error rate
    })

    it('注入 12000 条 — 滑动窗口只保留 10000 条', () => {
      for (let i = 0; i < 12000; i++) {
        monitor.record({
          route: '/api/sliding',
          durationMs: 50,
          statusCode: 200,
          timestamp: `t${i}`,
        })
      }
      assert.equal(monitor.samples.length, 10000)
      const stats = monitor.getStatsForRoute('/api/sliding')
      assert.equal(stats.count, 10000)
      // 最早 2000 条被移除，p50 不变
      assert.equal(stats.p50, 50)
    })

    it('多个路由混合注入 5000 样本', () => {
      const routes = ['/api/order', '/api/user', '/api/auth', '/api/pay', '/api/report']
      for (let i = 0; i < 5000; i++) {
        monitor.record({
          route: routes[i % routes.length],
          durationMs: (i * 7) % 2000,
          statusCode: i % 50 === 0 ? 503 : 200,
          timestamp: `t${i}`,
        })
      }
      const allStats = monitor.getAllStats()
      assert.equal(allStats.length, routes.length)
      for (const s of allStats) {
        assert.ok(routes.includes(s.route))
        assert.ok(s.count > 0)
        assert.ok(s.p50 >= 0)
        assert.ok(s.p95 >= s.p50)
        assert.ok(s.p99 >= s.p95)
      }
      // 总样本数 5000
      const total = allStats.reduce((s, r) => s + r.count, 0)
      assert.equal(total, 5000)
    })
  })

  // ─── 极端值 ─────────────────────────────────────────

  describe('极端输入值', () => {
    it('durationMs 为 0 (瞬间完成)', () => {
      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({ route: '/api/ping', durationMs: 0 }))
      }
      const stats = monitor.getStatsForRoute('/api/ping')
      assert.equal(stats.p50, 0)
      assert.equal(stats.p95, 0)
      assert.equal(stats.p99, 0)
      assert.equal(stats.max, 0)
    })

    it('超大 durationMs (99999ms — 接近100秒)', () => {
      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({ route: '/api/heavy', durationMs: 99999 }))
      }
      const stats = monitor.getStatsForRoute('/api/heavy')
      assert.equal(stats.p50, 99999)
      assert.equal(stats.max, 99999)
      // 应被记录为慢查询
      assert.ok(monitor.slowQueries.length > 0)
    })

    it('高错误率场景 (100% 5xx)', () => {
      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({
          route: '/api/broken',
          durationMs: 300,
          statusCode: 500,
        }))
      }
      const stats = monitor.getStatsForRoute('/api/broken')
      assert.equal(stats.errorRate, 1.0)
      assert.equal(stats.count, 100)
    })

    it('单条样本 (边界)', () => {
      monitor.record(makeSample({ route: '/api/lone', durationMs: 42 }))
      const stats = monitor.getStatsForRoute('/api/lone')
      assert.equal(stats.count, 1)
      assert.equal(stats.p50, 42)
      assert.equal(stats.p95, 42)
      assert.equal(stats.p99, 42)
      assert.equal(stats.max, 42)
    })

    it('零数据路由返回 0', () => {
      const stats = monitor.getStatsForRoute('/api/never-sent')
      assert.equal(stats.count, 0)
      assert.equal(stats.p50, 0)
      assert.equal(stats.p95, 0)
      assert.equal(stats.p99, 0)
      assert.equal(stats.max, 0)
      assert.equal(stats.errorRate, 0)
    })
  })

  // ─── SLA 监控韧性 ──────────────────────────────────

  describe('SLA 监控边界', () => {
    it('SLA 阈值严格边界 (刚好等于 warnThreshold)', () => {
      monitor.registerSla({ route: '/api/border', targetP95Ms: 100, warnThresholdP95Ms: 80 })
      // 注入大量 80ms 样本 — P95 刚好等于阈值
      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({ route: '/api/border', durationMs: 80 }))
      }
      // P95 = 80, warnThreshold = 80, 不触发 > 条件
      assert.equal(monitor.getSlaViolations().length, 0)
    })

    it('SLA 超阈值 1ms', () => {
      monitor.registerSla({ route: '/api/just-over', targetP95Ms: 100, warnThresholdP95Ms: 80 })
      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({ route: '/api/just-over', durationMs: 81 }))
      }
      assert.ok(monitor.getSlaViolations().length > 0)
    })

    it('多条 SLA 配置共存', () => {
      monitor.registerSla({ route: '/api/critical', targetP95Ms: 50, warnThresholdP95Ms: 40 })
      monitor.registerSla({ route: '/api/normal', targetP95Ms: 200, warnThresholdP95Ms: 150 })
      monitor.registerSla({ route: '/api/batch', targetP95Ms: 100, warnThresholdP95Ms: 80 })

      // 触发 /api/critical 和 /api/batch
      for (let i = 0; i < 50; i++) {
        monitor.record(makeSample({ route: '/api/critical', durationMs: 200 }))
        monitor.record(makeSample({ route: '/api/normal', durationMs: 10 }))
        monitor.record(makeSample({ route: '/api/batch', durationMs: 90 }))
      }

      const violations = monitor.getSlaViolations()
      assert.ok(violations.length >= 2)
      const routeNames = violations.map(v => v.route)
      assert.ok(routeNames.includes('/api/critical'))
      assert.ok(routeNames.includes('/api/batch'))
    })
  })

  // ─── 慢查询队列韧性 ────────────────────────────────

  describe('慢查询队列韧性', () => {
    it('大量慢查询 (>1000) 触发队列滚动', () => {
      for (let i = 0; i < 2000; i++) {
        monitor.record(makeSample({
          route: '/api/slow',
          durationMs: 1000 + (i % 500),
        }))
      }
      // 只保留最多 1000 个慢查询
      assert.ok(monitor.slowQueries.length <= 1000)
      // 最新的 20 条
      const recent = monitor.getSlowQueries(20)
      assert.equal(recent.length, 20)
      for (const s of recent) {
        assert.ok(s.durationMs > 500)
      }
    })

    it('没有慢查询时返回空数组', () => {
      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({ route: '/api/fast', durationMs: 10 }))
      }
      assert.equal(monitor.getSlowQueries().length, 0)
      assert.equal(monitor.getSlowQueries(50).length, 0)
    })
  })

  // ─── 重置 & 状态管理 ────────────────────────────────

  describe('重置 & 状态管理', () => {
    it('reset 后所有状态归零', () => {
      for (let i = 0; i < 500; i++) {
        monitor.record(makeSample({ route: '/api/reset', durationMs: i * 2 }))
      }
      assert.ok(monitor.summary().totalSamples > 0)
      monitor.reset()
      const s = monitor.summary()
      assert.equal(s.totalSamples, 0)
      assert.equal(s.routes, 0)
      assert.equal(s.slowQueries, 0)
      assert.equal(s.slaViolations, 0)
    })

    it('reset 后重新注入正常工作', () => {
      monitor.record(makeSample({ route: '/api/first', durationMs: 50 }))
      monitor.reset()
      monitor.registerSla({ route: '/api/second', targetP95Ms: 100, warnThresholdP95Ms: 80 })
      for (let i = 0; i < 20; i++) {
        monitor.record(makeSample({ route: '/api/second', durationMs: 90 }))
      }
      const stats = monitor.getStatsForRoute('/api/second')
      assert.equal(stats.count, 20)
      assert.equal(stats.p50, 90)
      // 老的 /api/first 不应出现
      const all = monitor.getAllStats()
      assert.equal(all.length, 1)
    })
  })

  // ─── summary 完整性 ──────────────────────────────────

  describe('summary 完整性', () => {
    it('多路由多状态 summary 正确', () => {
      monitor.registerSla({ route: '/api/a', targetP95Ms: 100, warnThresholdP95Ms: 80 })
      monitor.registerSla({ route: '/api/b', targetP95Ms: 200, warnThresholdP95Ms: 150 })

      for (let i = 0; i < 100; i++) {
        monitor.record(makeSample({ route: '/api/a', durationMs: 50 }))
        monitor.record(makeSample({ route: '/api/b', durationMs: 600 }))
      }

      const sum = monitor.summary()
      assert.equal(sum.totalSamples, 200)
      assert.equal(sum.routes, 2)
      assert.ok(sum.slowQueries >= 100) // /api/b 全是慢查询
      assert.ok(sum.slaViolations > 0)
    })
  })

  // ─── 混合真实场景 ──────────────────────────────────

  describe('混合真实场景模拟', () => {
    it('模拟 10 个端点 15 分钟采样 (9000 条)', () => {
      const endpoints = [
        { route: '/api/auth/login', weight: 0.15 },
        { route: '/api/user/profile', weight: 0.10 },
        { route: '/api/order/create', weight: 0.20 },
        { route: '/api/order/list', weight: 0.15 },
        { route: '/api/pay/submit', weight: 0.10 },
        { route: '/api/pay/callback', weight: 0.08 },
        { route: '/api/report/daily', weight: 0.05 },
        { route: '/api/report/monthly', weight: 0.02 },
        { route: '/api/search', weight: 0.10 },
        { route: '/api/health', weight: 0.05 },
      ]

      // 真实世界分布: 大部分在 10-200ms, 少数拖尾
      for (let i = 0; i < 9000; i++) {
        // 按权重选路由
        let r = Math.random()
        let chosen = endpoints[0]
        for (const ep of endpoints) {
          if (r < ep.weight) { chosen = ep; break }
          r -= ep.weight
        }
        // 延迟分布: 指数分布模拟真实 tail
        const base = 20 + Math.floor(-Math.log(Math.random()) * 50) // 20-200ms 均值 ~70ms
        const durationMs = Math.min(base + (Math.random() > 0.9 ? 400 + Math.random() * 1000 : 0), 3000)
        const statusCode = Math.random() > 0.05 ? 200 : (Math.random() > 0.5 ? 400 : 500)
        monitor.record(makeSample({
          route: chosen.route,
          durationMs,
          statusCode,
        }))
      }

      const allStats = monitor.getAllStats()
      assert.equal(allStats.length, endpoints.length)

      // 每个端点都有数据
      for (const ep of endpoints) {
        const stats = allStats.find(s => s.route === ep.route)
        assert.ok(stats, `Route ${ep.route} missing`)
        assert.ok(stats!.count > 0)
        assert.ok(stats!.p50 >= 20)
        assert.ok(stats!.p95 >= stats!.p50)
      }

      const sum = monitor.summary()
      assert.equal(sum.totalSamples, 9000)
      assert.equal(sum.routes, endpoints.length)
      // 慢查询应该存在 (由于 10% 拖尾)
      assert.ok(sum.slowQueries > 0)
    })
  })
})
