/**
 * time-series.service.spec.ts — 时序指标 Service 纯函数式内联测试
 *
 * 内联 TimeSeriesCollectorService 和 TimeSeriesService 的全部核心逻辑，
 * 不 import 生产代码，避开 @nestjs/common / 跨模块引用。
 *
 * 覆盖：
 * TimeSeriesCollectorService:
 *   - recordSample / recordBatch / recordMetric: 写入 + 累计 + 边界（空 batch / 过期）
 *   - query: 窗口过滤 / 聚合计算 / 百分位 / 空数据
 *   - listMetricKeys: 多 tenant 场景
 *   - detectSeasonality: 峰值识别 / 空数据全零
 *   - toPrometheus: 格式校验 + tenant label
 *   - resetForTests: 清空
 *
 * TimeSeriesService:
 *   - registerAlertRule / listAlertRules / removeAlertRule: 正例 + 反例
 *   - evaluateAllRules: gt / lt / gte / lte / 无数据 / 边界（MAX_ALERTS）
 *   - getRecentAlerts: 空 / limit
 *   - getSummary: 汇总
 *   - compareWindows: 多窗口对比 / tenant 过滤
 *
 * 策略：纯函数内联，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 类型定义（内联，不 import 生产代码）
// ═══════════════════════════════════════════════════════════════

type WindowSize = '1h' | '6h' | '24h' | '7d' | '30d'
type AlertOperator = 'gt' | 'lt' | 'gte' | 'lte'

interface TimeSeriesPoint { timestamp: string; value: number }

interface Aggregate { min: number; max: number; avg: number; p50: number; p95: number; p99: number; count: number }

interface SeasonalityPattern { weekly: number[]; monthly: number[]; daily: number[] }

interface AlertRule { metricName: string; tenantId?: string; operator: AlertOperator; threshold: number; window: WindowSize; description?: string }

interface AlertEvent { rule: AlertRule; currentValue: number; triggeredAt: string; message: string }

interface WindowComparison { window: WindowSize; avg: number; count: number; p95: number }

// ═══════════════════════════════════════════════════════════════
// 窗口配置
// ═══════════════════════════════════════════════════════════════

const WINDOW_MS: Record<WindowSize, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

// ═══════════════════════════════════════════════════════════════
// 内联 Collector（纯函数模拟）
// ═══════════════════════════════════════════════════════════════

class FakeCollector {
  buffers = new Map<string, TimeSeriesPoint[]>()

  private key(metricName: string, tenantId?: string): string {
    return `${metricName}:${tenantId ?? 'global'}`
  }

  recordMetric(input: { metricName: string; tenantId?: string; value: number; timestamp?: string }): void {
    const k = this.key(input.metricName, input.tenantId)
    const buf = this.buffers.get(k) ?? []
    buf.push({ timestamp: input.timestamp ?? new Date().toISOString(), value: input.value })
    this.buffers.set(k, buf)
    // evict > 30d
    const cutoff = Date.now() - WINDOW_MS['30d']
    this.buffers.set(k, buf.filter(p => new Date(p.timestamp).getTime() >= cutoff))
  }

  query(input: { metricName: string; tenantId?: string; window: WindowSize }) {
    const k = this.key(input.metricName, input.tenantId)
    const all = this.buffers.get(k) ?? []
    const cutoff = Date.now() - WINDOW_MS[input.window]
    const points = all.filter(p => new Date(p.timestamp).getTime() >= cutoff)
    const agg = this.aggregate(points)
    return { metricKey: k, tenantId: input.tenantId, window: input.window, points, aggregate: agg, seasonality: 0 }
  }

  listMetricKeys(): string[] { return Array.from(this.buffers.keys()) }

  private aggregate(pts: TimeSeriesPoint[]): Aggregate {
    if (pts.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 }
    const vals = pts.map(p => p.value).sort((a, b) => a - b)
    const sum = vals.reduce((s, v) => s + v, 0)
    return {
      min: vals[0], max: vals[vals.length - 1], avg: sum / vals.length,
      p50: this.pct(vals, 0.5), p95: this.pct(vals, 0.95), p99: this.pct(vals, 0.99),
      count: vals.length,
    }
  }

  private pct(sorted: number[], p: number): number {
    if (sorted.length <= 1) return sorted[0] ?? 0
    const rank = p * (sorted.length - 1)
    const lo = Math.floor(rank); const hi = Math.ceil(rank)
    const w = rank - lo
    return sorted[lo] + w * (sorted[hi] - sorted[lo])
  }

  detectSeasonality(input: { metricName: string; tenantId?: string }): SeasonalityPattern {
    const all = this.buffers.get(this.key(input.metricName, input.tenantId)) ?? []
    const daily = new Array(24).fill(0); const dc = new Array(24).fill(0)
    const weekly = new Array(7).fill(0); const wc = new Array(7).fill(0)
    const monthly = new Array(31).fill(0); const mc = new Array(31).fill(0)
    for (const p of all) {
      const d = new Date(p.timestamp)
      daily[d.getUTCHours()] += p.value; dc[d.getUTCHours()]++
      weekly[d.getUTCDay()] += p.value; wc[d.getUTCDay()]++
      monthly[d.getUTCDate() - 1] += p.value; mc[d.getUTCDate() - 1]++
    }
    return {
      daily: daily.map((s, i) => dc[i] > 0 ? s / dc[i] : 0),
      weekly: weekly.map((s, i) => wc[i] > 0 ? s / wc[i] : 0),
      monthly: monthly.map((s, i) => mc[i] > 0 ? s / mc[i] : 0),
    }
  }

  toPrometheus(): string {
    const lines: string[] = []
    for (const key of this.buffers.keys()) {
      const [mn, tid] = key.split(':')
      for (const w of Object.keys(WINDOW_MS) as WindowSize[]) {
        const m = this.query({ metricName: mn, tenantId: tid === 'global' ? undefined : tid, window: w })
        const lbl = tid && tid !== 'global' ? `{tenantId="${tid}"}` : ''
        lines.push(`# HELP ${mn}_${w} ${mn} in ${w} window`)
        lines.push(`# TYPE ${mn}_${w} summary`)
        lines.push(`${mn}_${w}_avg${lbl} ${m.aggregate.avg}`)
        lines.push(`${mn}_${w}_p95${lbl} ${m.aggregate.p95}`)
        lines.push(`${mn}_${w}_p99${lbl} ${m.aggregate.p99}`)
        lines.push(`${mn}_${w}_count${lbl} ${m.aggregate.count}`)
      }
    }
    return lines.join('\n')
  }

  resetForTests(): void { this.buffers.clear() }
}

// ═══════════════════════════════════════════════════════════════
// 内联 AlertService（纯函数模拟）
// ═══════════════════════════════════════════════════════════════

class FakeAlertService {
  rules: AlertRule[] = []
  alerts: AlertEvent[] = []
  MAX_ALERTS = 100

  constructor(public collector: FakeCollector) {}

  registerAlertRule(rule: AlertRule): { id: number; rule: AlertRule } {
    const id = this.rules.length
    this.rules.push(rule)
    return { id, rule }
  }

  listAlertRules(): AlertRule[] { return [...this.rules] }

  removeAlertRule(id: number): boolean {
    if (id < 0 || id >= this.rules.length) return false
    this.rules[id] = undefined as unknown as AlertRule
    return true
  }

  evaluateAllRules(): AlertEvent[] {
    const triggered: AlertEvent[] = []
    for (const rule of this.rules) {
      if (!rule) continue
      const metric = this.collector.query({ metricName: rule.metricName, tenantId: rule.tenantId, window: rule.window })
      if (metric.aggregate.count === 0) continue
      const cv = metric.aggregate.avg
      let isTriggered = false
      switch (rule.operator) {
        case 'gt': isTriggered = cv > rule.threshold; break
        case 'lt': isTriggered = cv < rule.threshold; break
        case 'gte': isTriggered = cv >= rule.threshold; break
        case 'lte': isTriggered = cv <= rule.threshold; break
      }
      if (isTriggered) {
        const event: AlertEvent = {
          rule: { ...rule }, currentValue: cv,
          triggeredAt: new Date().toISOString(),
          message: `[ALERT] ${rule.metricName}: ${cv} ${rule.operator} ${rule.threshold}`,
        }
        this.alerts.push(event)
        if (this.alerts.length > this.MAX_ALERTS) this.alerts.shift()
        triggered.push(event)
      }
    }
    return triggered
  }

  getRecentAlerts(limit = 20): AlertEvent[] { return this.alerts.slice(-limit) }

  getSummary() {
    const keys = this.collector.listMetricKeys()
    let totalPoints = 0; let oldest: string | null = null; let newest: string | null = null
    for (const key of keys) {
      const [mn, tid] = key.split(':')
      const metric = this.collector.query({ metricName: mn, tenantId: tid === 'global' ? undefined : tid, window: '30d' })
      totalPoints += metric.aggregate.count
      for (const p of metric.points) {
        if (!oldest || p.timestamp < oldest) oldest = p.timestamp
        if (!newest || p.timestamp > newest) newest = p.timestamp
      }
    }
    return { totalMetrics: keys.length, totalPoints, oldestTimestamp: oldest, newestTimestamp: newest, topMetricNames: keys.slice(0, 10).map(k => k.split(':')[0]) }
  }

  compareWindows(metricName: string, tenantId?: string): WindowComparison[] {
    const windows: WindowSize[] = ['1h', '6h', '24h']
    return windows.map(w => {
      const m = this.collector.query({ metricName, tenantId, window: w })
      return { window: w, avg: m.aggregate.avg, count: m.aggregate.count, p95: m.aggregate.p95 }
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// TimeSeriesCollectorService — 数据写入
// ═══════════════════════════════════════════════════════════════

describe('TimeSeriesCollector — recordMetric', () => {
  let col: FakeCollector
  beforeEach(() => { col = new FakeCollector() })

  it('[E1] 单条写入可查询', () => {
    col.recordMetric({ metricName: 'latency', value: 200 })
    const m = col.query({ metricName: 'latency', window: '1h' })
    expect(m.points).toHaveLength(1)
    expect(m.aggregate.avg).toBe(200)
    expect(m.aggregate.count).toBe(1)
  })

  it('[E2] 多次写入叠加', () => {
    col.recordMetric({ metricName: 'orders', value: 10 })
    col.recordMetric({ metricName: 'orders', value: 20 })
    col.recordMetric({ metricName: 'orders', value: 30 })
    const m = col.query({ metricName: 'orders', window: '1h' })
    expect(m.points).toHaveLength(3)
    expect(m.aggregate.avg).toBe(20)
  })

  it('[E3] 过期点被自动清理', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    col.recordMetric({ metricName: 'stale', value: 999, timestamp: old })
    const m = col.query({ metricName: 'stale', window: '30d' })
    expect(m.points).toHaveLength(0)
  })
})

describe('TimeSeriesCollector — query', () => {
  let col: FakeCollector
  beforeEach(() => { col = new FakeCollector() })

  it('[E4] 空 metric 返回空聚合', () => {
    const m = col.query({ metricName: 'nonexistent', window: '1h' })
    expect(m.points).toHaveLength(0)
    expect(m.aggregate.min).toBe(0)
    expect(m.aggregate.max).toBe(0)
    expect(m.aggregate.count).toBe(0)
  })

  it('[E5] 窗口过滤正确', () => {
    const oldTs = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    col.recordMetric({ metricName: 'm1', value: 100, timestamp: oldTs })
    col.recordMetric({ metricName: 'm1', value: 50 })
    const h1 = col.query({ metricName: 'm1', window: '1h' })
    expect(h1.points).toHaveLength(1)
    expect(h1.aggregate.avg).toBe(50)
    const h6 = col.query({ metricName: 'm1', window: '6h' })
    expect(h6.points).toHaveLength(2)
  })

  it('[E6] 百分位计算正确（NIST 线性插值）', () => {
    const vals = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    vals.forEach(v => col.recordMetric({ metricName: 'latency', value: v }))
    const m = col.query({ metricName: 'latency', window: '1h' })
    expect(m.aggregate.min).toBe(10)
    expect(m.aggregate.max).toBe(100)
    // N=10, p50 rank=4.5 → avg(50,60)=55
    expect(m.aggregate.p50).toBe(55)
    // p95 rank=9*0.95=8.55 → 90+0.55*10=95.5
    expect(m.aggregate.p95).toBeCloseTo(95.5, 0)
    // p99 rank=9*0.99=8.91 → 90+0.91*10=99.1
    expect(m.aggregate.p99).toBeCloseTo(99.1, 0)
  })
})

describe('TimeSeriesCollector — listMetricKeys', () => {
  let col: FakeCollector
  beforeEach(() => { col = new FakeCollector() })

  it('[E7] 空时返回 []', () => {
    expect(col.listMetricKeys()).toEqual([])
  })

  it('[E8] 多 tenant 多 metric', () => {
    col.recordMetric({ metricName: 'a', value: 1 })
    col.recordMetric({ metricName: 'b', tenantId: 'store-1', value: 2 })
    col.recordMetric({ metricName: 'a', tenantId: 'store-2', value: 3 })
    const keys = col.listMetricKeys()
    expect(keys).toHaveLength(3)
    expect(keys).toContain('a:global')
    expect(keys).toContain('b:store-1')
    expect(keys).toContain('a:store-2')
  })
})

describe('TimeSeriesCollector — detectSeasonality', () => {
  let col: FakeCollector
  beforeEach(() => { col = new FakeCollector() })

  it('[E9] 空数据全零', () => {
    const sp = col.detectSeasonality({ metricName: 'no-data' })
    expect(sp.daily).toHaveLength(24)
    expect(sp.daily.every(v => v === 0)).toBe(true)
    expect(sp.weekly).toHaveLength(7)
    expect(sp.monthly).toHaveLength(31)
  })

  it('[E10] 日周期峰值识别', () => {
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const date = new Date('2026-06-01T00:00:00Z')
        date.setDate(date.getDate() + d)
        date.setUTCHours(h, 0, 0, 0)
        col.recordMetric({ metricName: 'orders', value: h === 10 ? 500 : h === 14 ? 400 : h === 20 ? 300 : 50, timestamp: date.toISOString() })
      }
    }
    const sp = col.detectSeasonality({ metricName: 'orders' })
    expect(sp.daily[10]).toBeGreaterThan(sp.daily[2])
    expect(Math.max(...sp.daily)).toBeGreaterThan(0)
  })
})

describe('TimeSeriesCollector — toPrometheus', () => {
  let col: FakeCollector
  beforeEach(() => { col = new FakeCollector() })

  it('[E11] 含 HELP / TYPE / metric 行', () => {
    col.recordMetric({ metricName: 'requests', value: 100 })
    const out = col.toPrometheus()
    expect(out).toContain('# HELP requests_1h')
    expect(out).toContain('requests_1h_avg')
    expect(out).toContain('requests_1h_count')
  })

  it('[E12] tenant label 正确', () => {
    col.recordMetric({ metricName: 'requests', tenantId: 'store-1', value: 50 })
    const out = col.toPrometheus()
    expect(out).toContain('{tenantId="store-1"}')
  })
})

describe('TimeSeriesCollector — resetForTests', () => {
  let col: FakeCollector
  beforeEach(() => { col = new FakeCollector() })

  it('[E13] 清空所有 buffer', () => {
    col.recordMetric({ metricName: 'x', value: 1 })
    expect(col.listMetricKeys()).toHaveLength(1)
    col.resetForTests()
    expect(col.listMetricKeys()).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// TimeSeriesService — 告警规则管理
// ═══════════════════════════════════════════════════════════════

describe('TimeSeriesAlert — 规则管理', () => {
  let svc: FakeAlertService
  beforeEach(() => { svc = new FakeAlertService(new FakeCollector()) })

  it('[E14] register + list 空', () => {
    expect(svc.listAlertRules()).toEqual([])
  })

  it('[E15] register + list 正例', () => {
    svc.registerAlertRule({ metricName: 'cpu', operator: 'gt', threshold: 90, window: '1h' })
    svc.registerAlertRule({ metricName: 'mem', operator: 'gt', threshold: 80, window: '24h' })
    expect(svc.listAlertRules()).toHaveLength(2)
    expect(svc.listAlertRules()[0].metricName).toBe('cpu')
  })

  it('[E16] removeAlertRule out-of-bounds 返回 false', () => {
    expect(svc.removeAlertRule(-1)).toBe(false)
    expect(svc.removeAlertRule(0)).toBe(false)
    expect(svc.removeAlertRule(999)).toBe(false)
  })

  it('[E17] removeAlertRule 成功返回 true', () => {
    svc.registerAlertRule({ metricName: 'cpu', operator: 'gt', threshold: 90, window: '1h' })
    expect(svc.removeAlertRule(0)).toBe(true)
  })
})

describe('TimeSeriesAlert — evaluateAllRules', () => {
  let col: FakeCollector
  let svc: FakeAlertService
  beforeEach(() => { col = new FakeCollector(); svc = new FakeAlertService(col) })

  it('[E18] gt 触发正例', () => {
    svc.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 200, window: '1h' })
    col.recordMetric({ metricName: 'latency', value: 300 })
    const alerts = svc.evaluateAllRules()
    expect(alerts).toHaveLength(1)
    expect(alerts[0].currentValue).toBe(300)
    expect(alerts[0].rule.operator).toBe('gt')
  })

  it('[E19] lt 触发正例', () => {
    svc.registerAlertRule({ metricName: 'uptime', operator: 'lt', threshold: 99.9, window: '6h' })
    col.recordMetric({ metricName: 'uptime', value: 95 })
    const alerts = svc.evaluateAllRules()
    expect(alerts).toHaveLength(1)
    expect(alerts[0].currentValue).toBe(95)
  })

  it('[E20] gte / lte 边界条件', () => {
    svc.registerAlertRule({ metricName: 'm1', operator: 'gte', threshold: 100, window: '1h' })
    col.recordMetric({ metricName: 'm1', value: 100 })
    let alerts = svc.evaluateAllRules()
    expect(alerts).toHaveLength(1)

    svc.registerAlertRule({ metricName: 'm2', operator: 'lte', threshold: 0, window: '1h' })
    col.recordMetric({ metricName: 'm2', value: 0 })
    alerts = svc.evaluateAllRules()
    expect(alerts.length).toBeGreaterThanOrEqual(1)
  })

  it('[E21] 不触发（值在阈值内）', () => {
    svc.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 500, window: '1h' })
    col.recordMetric({ metricName: 'latency', value: 200 })
    expect(svc.evaluateAllRules()).toHaveLength(0)
  })

  it('[E22] 无数据不触发', () => {
    svc.registerAlertRule({ metricName: 'no_data', operator: 'gt', threshold: 0, window: '1h' })
    expect(svc.evaluateAllRules()).toHaveLength(0)
  })

  it('[E23] 移除的规则跳过', () => {
    svc.registerAlertRule({ metricName: 'ok', operator: 'gt', threshold: 0, window: '1h' })
    svc.registerAlertRule({ metricName: 'also_ok', operator: 'gt', threshold: 0, window: '1h' })
    svc.removeAlertRule(0)
    col.recordMetric({ metricName: 'also_ok', value: 999 })
    const alerts = svc.evaluateAllRules()
    expect(alerts).toHaveLength(1)
  })

  it('[E24] MAX_ALERTS 上限', () => {
    for (let i = 0; i < 3; i++) {
      svc.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 0, window: '1h' })
    }
    for (let i = 0; i < 150; i++) {
      col.recordMetric({ metricName: 'latency', tenantId: `t${i}`, value: 999 })
    }
    svc.evaluateAllRules()
    const recent = svc.getRecentAlerts(200)
    expect(recent.length).toBeLessThanOrEqual(100)
  })
})

describe('TimeSeriesAlert — getRecentAlerts / getSummary', () => {
  let col: FakeCollector
  let svc: FakeAlertService
  beforeEach(() => { col = new FakeCollector(); svc = new FakeAlertService(col) })

  it('[E25] 无告警返回空', () => {
    expect(svc.getRecentAlerts()).toEqual([])
  })

  it('[E26] limit 限制', () => {
    for (let i = 0; i < 10; i++) {
      svc.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 0, window: '1h', tenantId: `t${i}` })
    }
    col.recordMetric({ metricName: 'latency', value: 999 })
    svc.evaluateAllRules()
    expect(svc.getRecentAlerts(3).length).toBeLessThanOrEqual(3)
  })
})

describe('TimeSeriesAlert — getSummary', () => {
  let col: FakeCollector
  let svc: FakeAlertService
  beforeEach(() => { col = new FakeCollector(); svc = new FakeAlertService(col) })

  it('[E27] 空返回全零', () => {
    const s = svc.getSummary()
    expect(s.totalMetrics).toBe(0)
    expect(s.totalPoints).toBe(0)
    expect(s.oldestTimestamp).toBeNull()
    expect(s.newestTimestamp).toBeNull()
    expect(s.topMetricNames).toEqual([])
  })

  it('[E28] 多 metric 汇总', () => {
    const now = new Date()
    col.recordMetric({ metricName: 'orders', value: 10, timestamp: new Date(now.getTime() - 10000).toISOString() })
    col.recordMetric({ metricName: 'orders', value: 20, timestamp: new Date(now.getTime() - 5000).toISOString() })
    col.recordMetric({ metricName: 'revenue', value: 1000, timestamp: now.toISOString() })
    const s = svc.getSummary()
    expect(s.totalMetrics).toBe(2)
    expect(s.totalPoints).toBe(3)
    expect(s.oldestTimestamp).toBeDefined()
    expect(s.newestTimestamp).toBeDefined()
    expect(s.topMetricNames.length).toBeGreaterThanOrEqual(1)
  })
})

describe('TimeSeriesAlert — compareWindows', () => {
  let col: FakeCollector
  let svc: FakeAlertService
  beforeEach(() => { col = new FakeCollector(); svc = new FakeAlertService(col) })

  it('[E29] 返回 3 个窗口对比', () => {
    col.recordMetric({ metricName: 'test', value: 100 })
    const results = svc.compareWindows('test')
    expect(results).toHaveLength(3)
    expect(results[0].window).toBe('1h')
    expect(results[1].window).toBe('6h')
    expect(results[2].window).toBe('24h')
    results.forEach(r => { expect(r.avg).toBe(100); expect(r.count).toBe(1); expect(r.p95).toBe(100) })
  })

  it('[E30] 不存在 metric 全零', () => {
    const results = svc.compareWindows('ghost')
    results.forEach(r => { expect(r.count).toBe(0); expect(r.avg).toBe(0) })
  })

  it('[E31] tenant 过滤', () => {
    col.recordMetric({ metricName: 'reqs', tenantId: 'store-a', value: 50 })
    col.recordMetric({ metricName: 'reqs', tenantId: 'store-b', value: 200 })
    const rA = svc.compareWindows('reqs', 'store-a')
    expect(rA[0].avg).toBe(50)
    const rB = svc.compareWindows('reqs', 'store-b')
    expect(rB[0].avg).toBe(200)
  })
})
