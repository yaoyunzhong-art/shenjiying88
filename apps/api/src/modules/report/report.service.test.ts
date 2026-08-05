/**
 * report.service.spec.ts — 报表/看板 Service 纯函数式内联测试
 *
 * 覆盖：
 *   - Report CRUD: 创建/获取/列表
 *   - 数据查询/聚合: query / aggregateBy / ingestDataPoints
 *   - 缓存: TTL 命中/过期
 *   - 看板 CRUD: 创建/获取/列表/更新
 *   - 边界: 不存在的 ID / 维度匹配 / 缓存过期
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const REPORT_PERIODS = ['daily', 'weekly', 'monthly', 'custom'] as const
const REPORT_METRICS = ['sales.amount', 'sales.count', 'member.new', 'member.active', 'inventory.turnover', 'marketing.roi', 'ai.tokens', 'ai.latency'] as const
const REPORT_DIMENSIONS = ['store', 'tenant', 'brand', 'category', 'product', 'campaign', 'member_tier'] as const
const DISPLAY_TYPES = ['line', 'bar', 'pie', 'number', 'table', 'heatmap'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineReportDefinition {
  id: string
  name: string
  period: string
  metrics: string[]
  dimensions: string[]
  source: string
  cacheTtl: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface InlineReportDataPoint {
  bucket: string
  dimension: string
  metric: string
  value: number
}

interface InlineDashboardCard {
  id: string
  reportId: string
  display: string
  title: string
  size: { w: number; h: number }
  position: { x: number; y: number }
}

interface InlineDashboardLayout {
  id: string
  name: string
  cards: InlineDashboardCard[]
  ownerId: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

interface InlineReportQueryResponse {
  reportId: string
  period: string
  generatedAt: string
  data: InlineReportDataPoint[]
  totalPoints: number
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 report.service.ts 核心函数
// ═══════════════════════════════════════════════════════════════

function inlineCreateReport(
  store: Map<string, InlineReportDefinition>,
  input: { name: string; period: string; metrics: string[]; dimensions: string[]; source: string; cacheTtl: number; createdBy: string },
): InlineReportDefinition {
  const id = `rpt-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()
  const report: InlineReportDefinition = { ...input, id, createdAt: now, updatedAt: now }
  store.set(id, report)
  return report
}

function inlineGetReport(
  store: Map<string, InlineReportDefinition>,
  id: string,
): InlineReportDefinition | null {
  return store.get(id) ?? null
}

function inlineListReports(
  store: Map<string, InlineReportDefinition>,
): InlineReportDefinition[] {
  return Array.from(store.values())
}

function inlineSourceToDataSource(metric: string): string {
  if (metric.startsWith('sales')) return 'orders'
  if (metric.startsWith('member')) return 'members'
  if (metric.startsWith('inventory')) return 'inventory'
  if (metric.startsWith('marketing')) return 'marketing'
  if (metric.startsWith('ai')) return 'ai_logs'
  return 'orders'
}

function inlineAggregate(
  dataPoints: InlineReportDataPoint[],
  report: InlineReportDefinition,
  metrics: string[],
  from?: string,
  to?: string,
): InlineReportDataPoint[] {
  return dataPoints.filter((dp) => {
    if (!metrics.includes(dp.metric)) return false
    if (report.source !== inlineSourceToDataSource(dp.metric)) return false
    if (from !== undefined && dp.bucket < from) return false
    if (to !== undefined && dp.bucket > to) return false
    return true
  })
}

function inlineQuery(
  reports: Map<string, InlineReportDefinition>,
  dataPoints: InlineReportDataPoint[],
  cache: Map<string, { value: InlineReportQueryResponse; expiresAt: number }>,
  reportId: string,
  period: string,
  from?: string,
  to?: string,
  metrics?: string[],
): { response: InlineReportQueryResponse | null; error?: string } {
  const cacheKey = `${reportId}:${period}:${from ?? ''}:${to ?? ''}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { response: cached.value }
  }

  const report = reports.get(reportId)
  if (!report) return { response: null, error: `Report ${reportId} not found` }

  const m = metrics ?? report.metrics
  const data = inlineAggregate(dataPoints, report, m, from, to)
  const response: InlineReportQueryResponse = {
    reportId,
    period,
    generatedAt: new Date().toISOString(),
    data,
    totalPoints: data.length,
  }
  cache.set(cacheKey, { value: response, expiresAt: Date.now() + report.cacheTtl * 1000 })
  return { response }
}

function inlineIngestDataPoints(
  dataPoints: InlineReportDataPoint[],
  points: InlineReportDataPoint[],
  cache: Map<string, unknown>,
): void {
  dataPoints.push(...points)
  if (dataPoints.length > 100000) {
    dataPoints.splice(0, dataPoints.length - 100000)
  }
  cache.clear()
}

function inlineAggregateBy(
  dataPoints: InlineReportDataPoint[],
  metric: string,
): Map<string, number> {
  const result = new Map<string, number>()
  for (const dp of dataPoints) {
    if (dp.metric !== metric) continue
    const key = dp.dimension
    result.set(key, (result.get(key) ?? 0) + dp.value)
  }
  return result
}

function inlineCreateDashboard(
  store: Map<string, InlineDashboardLayout>,
  input: { name: string; cards: InlineDashboardCard[]; ownerId: string; isShared: boolean },
): InlineDashboardLayout {
  const id = `dash-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()
  const dashboard: InlineDashboardLayout = { ...input, id, createdAt: now, updatedAt: now }
  store.set(id, dashboard)
  return dashboard
}

function inlineGetDashboard(
  store: Map<string, InlineDashboardLayout>,
  id: string,
): InlineDashboardLayout | null {
  return store.get(id) ?? null
}

function inlineListDashboards(
  store: Map<string, InlineDashboardLayout>,
  ownerId: string,
): InlineDashboardLayout[] {
  return Array.from(store.values()).filter(
    (d) => d.ownerId === ownerId || d.isShared,
  )
}

function inlineUpdateDashboard(
  store: Map<string, InlineDashboardLayout>,
  id: string,
  patch: Partial<InlineDashboardLayout>,
): InlineDashboardLayout | null {
  const d = store.get(id)
  if (!d) return null
  const updated = { ...d, ...patch, id: d.id, updatedAt: new Date().toISOString() }
  store.set(id, updated)
  return updated
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeReportDef(overrides: Partial<InlineReportDefinition> = {}): InlineReportDefinition {
  return {
    id: 'rpt-test-001',
    name: '测试报表',
    period: 'daily',
    metrics: ['sales.amount', 'sales.count'],
    dimensions: ['store'],
    source: 'orders',
    cacheTtl: 60,
    createdBy: 'tester',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDataPoint(overrides: Partial<InlineReportDataPoint> = {}): InlineReportDataPoint {
  return {
    bucket: '2026-07-01',
    dimension: 'store-001',
    metric: 'sales.amount',
    value: 50000,
    ...overrides,
  }
}

function makeDashboard(overrides: Partial<InlineDashboardLayout> = {}): InlineDashboardLayout {
  return {
    id: 'dash-test-001',
    name: '总览看板',
    cards: [{ id: 'c1', reportId: 'rpt-test-001', display: 'number', title: '今日销售', size: { w: 3, h: 2 }, position: { x: 0, y: 0 } }],
    ownerId: 'tenant-A',
    isShared: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDashboardCard(overrides: Partial<InlineDashboardCard> = {}): InlineDashboardCard {
  return {
    id: 'c1',
    reportId: 'rpt-test-001',
    display: 'line',
    title: '销售趋势',
    size: { w: 6, h: 4 },
    position: { x: 0, y: 0 },
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('ReportService (内联纯函数)', () => {
  let reportStore: Map<string, InlineReportDefinition>
  let dataPoints: InlineReportDataPoint[]
  let dashboardStore: Map<string, InlineDashboardLayout>
  let cache: Map<string, { value: InlineReportQueryResponse; expiresAt: number }>

  beforeEach(() => {
    reportStore = new Map()
    dataPoints = []
    dashboardStore = new Map()
    cache = new Map()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 1. Report CRUD ───────────────────────────────────────────

  describe('1. Report CRUD', () => {
    it('创建报表 — 生成 id / createdAt / updatedAt', () => {
      const r = inlineCreateReport(reportStore, {
        name: '日销售报表',
        period: 'daily',
        metrics: ['sales.amount'],
        dimensions: ['store'],
        source: 'orders',
        cacheTtl: 60,
        createdBy: 'admin',
      })
      expect(r.id).toMatch(/^rpt-test-/)
      expect(r.name).toBe('日销售报表')
      expect(r.createdAt).toBeTruthy()
      expect(r.updatedAt).toBe(r.createdAt)
      expect(reportStore.size).toBe(1)
    })

    it('通过 ID 获取报表 — 存在返回对象，不存在返回 null', () => {
      const r = inlineCreateReport(reportStore, { name: '周销售报表', period: 'weekly', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 300, createdBy: 'admin' })
      expect(inlineGetReport(reportStore, r.id)).toEqual(r)
      expect(inlineGetReport(reportStore, 'nonexistent')).toBeNull()
    })

    it('列出全部报表 — 返回所有已创建的', () => {
      inlineCreateReport(reportStore, { name: 'R1', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'admin' })
      inlineCreateReport(reportStore, { name: 'R2', period: 'weekly', metrics: ['member.new'], dimensions: ['member_tier'], source: 'members', cacheTtl: 300, createdBy: 'admin' })
      const all = inlineListReports(reportStore)
      expect(all).toHaveLength(2)
      expect(all.map((r) => r.name).sort()).toEqual(['R1', 'R2'])
    })
  })

  // ── 2. 数据查询 ──────────────────────────────────────────────

  describe('2. 数据查询 & 聚合', () => {
    it('query — 返回匹配的指标数据点', () => {
      const rpt = inlineCreateReport(reportStore, { name: '销售日报', period: 'daily', metrics: ['sales.amount', 'sales.count'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'admin' })
      dataPoints.push(
        makeDataPoint({ bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 50000 }),
        makeDataPoint({ bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.count', value: 100 }),
        makeDataPoint({ bucket: '2026-07-01', dimension: 'store-001', metric: 'ai.tokens', value: 10000 }),
      )
      const res = inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily')
      expect(res.response).toBeTruthy()
      expect(res.response!.data).toHaveLength(2)
      expect(res.response!.data.map((d) => d.metric).sort()).toEqual(['sales.amount', 'sales.count'])
    })

    it('query — report 不存在返回 error', () => {
      const res = inlineQuery(reportStore, dataPoints, cache, 'nonexistent', 'daily')
      expect(res.response).toBeNull()
      expect(res.error).toContain('not found')
    })

    it('query — 支持 from/to 时间范围过滤', () => {
      const rpt = inlineCreateReport(reportStore, { name: '销售日报', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'admin' })
      dataPoints.push(
        makeDataPoint({ bucket: '2026-07-01', metric: 'sales.amount', value: 10000 }),
        makeDataPoint({ bucket: '2026-07-02', metric: 'sales.amount', value: 20000 }),
        makeDataPoint({ bucket: '2026-07-03', metric: 'sales.amount', value: 30000 }),
      )
      const res = inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily', '2026-07-02', '2026-07-03')
      expect(res.response!.data).toHaveLength(2)
      expect(res.response!.data.map((d) => d.value).sort()).toEqual([20000, 30000])
    })

    it('aggregateBy — 按维度聚合指定指标', () => {
      dataPoints.push(
        makeDataPoint({ dimension: 'store-001', metric: 'sales.amount', value: 50000 }),
        makeDataPoint({ dimension: 'store-001', metric: 'sales.amount', value: 30000 }),
        makeDataPoint({ dimension: 'store-002', metric: 'sales.amount', value: 40000 }),
        makeDataPoint({ dimension: 'store-002', metric: 'member.new', value: 10 }),
      )
      const agg = inlineAggregateBy(dataPoints, 'sales.amount')
      expect(agg.get('store-001')).toBe(80000)
      expect(agg.get('store-002')).toBe(40000)
      expect(agg.has('store-002')).toBe(true)
    })
  })

  // ── 3. 缓存 ──────────────────────────────────────────────────

  describe('3. 缓存行为', () => {
    it('缓存命中 — TTL 内返回相同结果', () => {
      const rpt = inlineCreateReport(reportStore, { name: '缓存测试', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'admin' })
      dataPoints.push(makeDataPoint({ bucket: '2026-07-01', metric: 'sales.amount', value: 10000 }))
      const res1 = inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily')
      // 插入新数据但不影响缓存
      dataPoints.push(makeDataPoint({ bucket: '2026-07-01', metric: 'sales.amount', value: 99999 }))
      const res2 = inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily')
      expect(res2.response!.data).toHaveLength(1)
      expect(res2.response!.data[0].value).toBe(10000)
    })

    it('缓存过期 — TTL 后重新聚合', () => {
      vi.setSystemTime(new Date('2026-07-01T00:00:00Z'))
      const rpt = inlineCreateReport(reportStore, { name: '缓存测试', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'admin' })
      dataPoints.push(makeDataPoint({ bucket: '2026-07-01', metric: 'sales.amount', value: 10000 }))
      inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily')
      dataPoints[0].value = 20000
      // 快进到 TTL 之后
      vi.setSystemTime(new Date('2026-07-01T00:02:00Z'))
      const res = inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily')
      expect(res.response!.data[0].value).toBe(20000)
    })
  })

  // ── 4. 数据注入 ──────────────────────────────────────────────

  describe('4. 数据注入', () => {
    it('ingestDataPoints — 追加数据并清空缓存', () => {
      const spy = vi.fn()
      cache.set('k1', { value: {} as InlineReportQueryResponse, expiresAt: Date.now() + 99999 })
      inlineIngestDataPoints(dataPoints, [makeDataPoint()], cache)
      expect(dataPoints).toHaveLength(1)
      expect(cache.size).toBe(0)
    })

    it('ingestDataPoints — 超过 100000 条自动裁剪', () => {
      const batch: InlineReportDataPoint[] = []
      for (let i = 0; i < 100010; i++) {
        batch.push(makeDataPoint({ bucket: `day-${i}` }))
      }
      inlineIngestDataPoints(dataPoints, batch, cache)
      expect(dataPoints.length).toBeLessThanOrEqual(100000)
    })
  })

  // ── 5. Dashboard CRUD ───────────────────────────────────────

  describe('5. Dashboard CRUD', () => {
    it('创建看板 — 生成 id / createdAt / updatedAt', () => {
      const d = inlineCreateDashboard(dashboardStore, {
        name: '运营看板',
        cards: [makeDashboardCard()],
        ownerId: 'tenant-A',
        isShared: false,
      })
      expect(d.id).toMatch(/^dash-test-/)
      expect(d.name).toBe('运营看板')
      expect(dashboardStore.size).toBe(1)
    })

    it('根据 ID 获取看板 — 存在返回，不存在 null', () => {
      const d = inlineCreateDashboard(dashboardStore, { name: '看板', cards: [], ownerId: 'tenant-A', isShared: false })
      expect(inlineGetDashboard(dashboardStore, d.id)).toEqual(d)
      expect(inlineGetDashboard(dashboardStore, 'nonexistent')).toBeNull()
    })

    it('列表看板 — 包含自己的 + 共享的', () => {
      inlineCreateDashboard(dashboardStore, { name: '私有', cards: [], ownerId: 'tenant-A', isShared: false })
      inlineCreateDashboard(dashboardStore, { name: '共享的', cards: [], ownerId: 'tenant-B', isShared: true })
      const list = inlineListDashboards(dashboardStore, 'tenant-A')
      expect(list).toHaveLength(2)
    })

    it('更新看板 — 部分字段更新', () => {
      const d = inlineCreateDashboard(dashboardStore, { name: '旧名称', cards: [], ownerId: 'tenant-A', isShared: false })
      const updated = inlineUpdateDashboard(dashboardStore, d.id, { name: '新名称', isShared: true })
      expect(updated!.name).toBe('新名称')
      expect(updated!.isShared).toBe(true)
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(d.createdAt).getTime())
    })

    it('更新看板 — 不存在返回 null', () => {
      expect(inlineUpdateDashboard(dashboardStore, 'nonexistent', { name: '新名称' })).toBeNull()
    })
  })

  // ── 6. 边界与错误 ────────────────────────────────────────────

  describe('6. 边界与反例', () => {
    it('query — 不存在的 report 返回 error', () => {
      const res = inlineQuery(reportStore, dataPoints, cache, 'rpt-missing', 'daily')
      expect(res.response).toBeNull()
      expect(res.error).toContain('not found')
    })

    it('query — 空数据返回 totalPoints=0', () => {
      const rpt = inlineCreateReport(reportStore, { name: '空报表', period: 'daily', metrics: ['inventory.turnover'], dimensions: ['store'], source: 'inventory', cacheTtl: 60, createdBy: 'admin' })
      const res = inlineQuery(reportStore, dataPoints, cache, rpt.id, 'daily')
      expect(res.response!.data).toHaveLength(0)
      expect(res.response!.totalPoints).toBe(0)
    })

    it('aggregateBy — 不存在的指标返回空 Map', () => {
      const agg = inlineAggregateBy(dataPoints, 'nonexistent.metric')
      expect(agg.size).toBe(0)
    })

    it('sourceToDataSource — 未匹配 metrics 回退 orders', () => {
      expect(inlineSourceToDataSource('unknown.metric')).toBe('orders')
    })

    it('aggregate — 只返回匹配 source 的数据', () => {
      const rpt = makeReportDef({ source: 'members', metrics: ['member.new'] })
      dataPoints.push(
        makeDataPoint({ metric: 'member.new', value: 10 }),
        makeDataPoint({ metric: 'sales.amount', value: 100 }),
      )
      const filtered = inlineAggregate(dataPoints, rpt, ['member.new', 'sales.amount'])
      expect(filtered).toHaveLength(1)
      expect(filtered[0].metric).toBe('member.new')
    })
  })
})
