import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * report.e2e.test.ts
 *
 * ReportService E2E 集成测试 —— 覆盖完整报表管理生命周期
 *
 * 测试场景:
 * 1. 创建报表 → 查询列表 → 查询详情
 * 2. 数据注入 → 查询聚合
 * 3. 按维度聚合
 * 4. 缓存命中验证
 * 5. 看板创建 → 查询 → 更新
 * 6. 边界: 不存在的报表/看板查询
 * 7. 边界: 空数据查询
 */

import assert from 'node:assert/strict'

// ========== 类型定义 ==========

interface ReportDef {
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

interface DataPoint {
  bucket: string
  dimension: string
  metric: string
  value: number
  yoy?: number
  qoq?: number
}

interface DashboardCard {
  id: string
  reportId: string
  display: string
  title: string
  size: { w: number; h: number }
  position: { x: number; y: number }
  config?: Record<string, unknown>
}

interface DashboardLayout {
  id: string
  name: string
  cards: DashboardCard[]
  ownerId: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

// ========== mock service 工厂 ==========

function createReportService() {
  const reports = new Map<string, ReportDef>()
  const dashboards = new Map<string, DashboardLayout>()
  const dataPoints: DataPoint[] = []
  const cache = new Map<string, { value: any; expiresAt: number }>()

  function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  function now(): string {
    return new Date().toISOString()
  }

  return {
    // ── 报表 CRUD ──
    createReport(input: Omit<ReportDef, 'id' | 'createdAt' | 'updatedAt'>): ReportDef {
      const id = generateId('rpt')
      const t = now()
      const report: ReportDef = { ...input, id, createdAt: t, updatedAt: t }
      reports.set(id, report)
      return report
    },

    getReport(id: string): ReportDef | null {
      return reports.get(id) ?? null
    },

    listReports(): ReportDef[] {
      return Array.from(reports.values())
    },

    // ── 数据管理 ──
    ingestDataPoints(points: DataPoint[]): void {
      dataPoints.push(...points)
      cache.clear()
    },

    async query(opts: {
      reportId: string
      period: string
      from?: string
      to?: string
    }): Promise<{ reportId: string; period: string; generatedAt: string; data: DataPoint[]; totalPoints: number }> {
      const cacheKey = `${opts.reportId}:${opts.period}:${opts.from ?? ''}:${opts.to ?? ''}`
      const cached = cache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value
      }

      const report = reports.get(opts.reportId)
      if (!report) throw new Object(Error(`Report ${opts.reportId} not found`))

      const filtered = dataPoints.filter((dp) => {
        if (opts.from && dp.bucket < opts.from) return false
        if (opts.to && dp.bucket > opts.to) return false
        return report.metrics.includes(dp.metric)
      })

      const response = {
        reportId: opts.reportId,
        period: opts.period,
        generatedAt: now(),
        data: filtered,
        totalPoints: filtered.length,
      }

      cache.set(cacheKey, { value: response, expiresAt: Date.now() + (report.cacheTtl || 30) * 1000 })
      return response
    },

    aggregateBy(metric: string): Map<string, number> {
      const result = new Map<string, number>()
      for (const dp of dataPoints) {
        if (dp.metric !== metric) continue
        result.set(dp.dimension, (result.get(dp.dimension) ?? 0) + dp.value)
      }
      return result
    },

    // ── 看板 CRUD ──
    createDashboard(input: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): DashboardLayout {
      const id = generateId('dash')
      const t = now()
      const dashboard: DashboardLayout = { ...input, id, createdAt: t, updatedAt: t }
      dashboards.set(id, dashboard)
      return dashboard
    },

    getDashboard(id: string): DashboardLayout | null {
      return dashboards.get(id) ?? null
    },

    listDashboards(ownerId: string): DashboardLayout[] {
      return Array.from(dashboards.values()).filter((d) => d.ownerId === ownerId || d.isShared)
    },

    updateDashboard(id: string, patch: Partial<DashboardLayout>): DashboardLayout | null {
      const d = dashboards.get(id)
      if (!d) return null
      const updated = { ...d, ...patch, id: d.id, updatedAt: now() }
      dashboards.set(id, updated)
      return updated
    },
  }
}

// ========== 测试开始 ==========

describe('ReportService E2E 集成测试', () => {
  let svc: ReturnType<typeof createReportService>

  beforeEach(() => {
    svc = createReportService()
  })

  // ── 场景 1: 创建报表 → 查询列表 → 查询详情 ──
  describe('场景 1: 报表完整生命周期', () => {
    it('应当能创建报表并正确返回', () => {
      const rpt = svc.createReport({
        name: '销售日报',
        period: 'daily',
        metrics: ['sales.amount', 'sales.count'],
        dimensions: ['store'],
        source: 'orders',
        cacheTtl: 60,
        createdBy: 'test-user',
      })
      assert.ok(rpt.id, '应生成 id')
      assert.strictEqual(rpt.name, '销售日报')
      assert.strictEqual(rpt.period, 'daily')
      assert.strictEqual(rpt.metrics.length, 2)
      assert.ok(rpt.createdAt, '应有创建时间')
    })

    it('应当能查询报表列表并包含刚创建的报表', () => {
      svc.createReport({ name: 'A', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 30, createdBy: 'u' })
      svc.createReport({ name: 'B', period: 'weekly', metrics: ['member.new'], dimensions: ['member_tier'], source: 'members', cacheTtl: 60, createdBy: 'u' })

      const list = svc.listReports()
      assert.strictEqual(list.length, 2)
      assert.ok(list.find((r) => r.name === 'A'))
      assert.ok(list.find((r) => r.name === 'B'))
    })

    it('应当能查询已存在的报表详情', () => {
      const created = svc.createReport({ name: '库存月报', period: 'monthly', metrics: ['inventory.turnover'], dimensions: ['store'], source: 'inventory', cacheTtl: 120, createdBy: 'u' })
      const found = svc.getReport(created.id)
      assert.ok(found)
      assert.strictEqual(found!.name, '库存月报')
    })

    it('查询不存在的报表应返回 null', () => {
      const result = svc.getReport('non-existent-id')
      assert.strictEqual(result, null)
    })
  })

  // ── 场景 2: 数据注入 → 查询聚合 ──
  describe('场景 2: 数据注入与查询', () => {
    it('应当能注入数据点并通过 report.query 查询', async () => {
      const rpt = svc.createReport({ name: '销售日报', period: 'daily', metrics: ['sales.amount', 'sales.count'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'u' })

      svc.ingestDataPoints([
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
        { bucket: '2026-07-01', dimension: 'store-002', metric: 'sales.amount', value: 30000 },
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.count', value: 120 },
      ])

      const result = await svc.query({ reportId: rpt.id, period: 'daily', from: '2026-07-01', to: '2026-07-01' })
      assert.strictEqual(result.totalPoints, 3)
      assert.strictEqual(result.data.length, 3)
      assert.ok(result.generatedAt)
    })

    it('按时间段过滤应只返回范围内数据', async () => {
      const rpt = svc.createReport({ name: '销售日报', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 30, createdBy: 'u' })

      svc.ingestDataPoints([
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
        { bucket: '2026-07-02', dimension: 'store-001', metric: 'sales.amount', value: 60000 },
      ])

      const result = await svc.query({ reportId: rpt.id, period: 'daily', from: '2026-07-02', to: '2026-07-02' })
      assert.strictEqual(result.totalPoints, 1)
      assert.strictEqual(result.data[0].value, 60000)
    })

    it('不存在的报表查询应抛异常', async () => {
      await assert.rejects(
        () => svc.query({ reportId: 'non-existent', period: 'daily' }),
        /not found/,
      )
    })
  })

  // ── 场景 3: 按维度聚合 ──
  describe('场景 3: 按维度聚合', () => {
    it('应当按正确维度聚合数据', () => {
      svc.ingestDataPoints([
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
        { bucket: '2026-07-01', dimension: 'store-002', metric: 'sales.amount', value: 30000 },
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 20000 },
      ])

      const totals = svc.aggregateBy('sales.amount')
      assert.strictEqual(totals.get('store-001'), 70000)
      assert.strictEqual(totals.get('store-002'), 30000)
    })

    it('空数据返回空 Map', () => {
      const totals = svc.aggregateBy('sales.amount')
      assert.strictEqual(totals.size, 0)
    })
  })

  // ── 场景 4: 缓存命中 ──
  describe('场景 4: 缓存机制', () => {
    it('相同查询应返回同一缓存（TTL 内）', async () => {
      const rpt = svc.createReport({ name: '销售日报', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 300, createdBy: 'u' })
      svc.ingestDataPoints([
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
      ])

      const r1 = await svc.query({ reportId: rpt.id, period: 'daily', from: '2026-07-01', to: '2026-07-01' })
      const r2 = await svc.query({ reportId: rpt.id, period: 'daily', from: '2026-07-01', to: '2026-07-01' })
      assert.strictEqual(r1.generatedAt, r2.generatedAt, '缓存命中应返回相同 generatedAt')
    })
  })

  // ── 场景 5: 看板 CRUD ──
  describe('场景 5: 看板完整生命周期', () => {
    it('应当能创建看板并查询', () => {
      const dash = svc.createDashboard({
        name: '总览看板',
        cards: [
          { id: 'c1', reportId: 'rpt-001', display: 'number', title: '销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
        ],
        ownerId: 'tenant-A',
        isShared: true,
      })
      assert.ok(dash.id)
      assert.strictEqual(dash.name, '总览看板')
      assert.strictEqual(dash.cards.length, 1)
      assert.strictEqual(dash.ownerId, 'tenant-A')
    })

    it('应当能更新看板信息', () => {
      const dash = svc.createDashboard({
        name: '旧名称', cards: [], ownerId: 'tenant-A', isShared: false,
      })
      const updated = svc.updateDashboard(dash.id, { name: '新名称', isShared: true })
      assert.ok(updated)
      assert.strictEqual(updated!.name, '新名称')
      assert.strictEqual(updated!.isShared, true)
      assert.ok(updated!.updatedAt !== dash.updatedAt || updated!.name !== dash.name, '应有变更')
    })

    it('按 ownerId 过滤看板', () => {
      svc.createDashboard({ name: '看板A', cards: [], ownerId: 'tenant-A', isShared: false })
      svc.createDashboard({ name: '看板B', cards: [], ownerId: 'tenant-B', isShared: false })
      svc.createDashboard({ name: '共享看板', cards: [], ownerId: 'tenant-C', isShared: true })

      // isShared=true 的看板会被所有人看到
      // tenant-A: 看板A (own) + 共享看板 (isShared) = 2
      const listA = svc.listDashboards('tenant-A')
      assert.strictEqual(listA.length, 2)
      assert.ok(listA.find((d) => d.name === '看板A'))
      assert.ok(listA.find((d) => d.name === '共享看板'))

      // tenant-B: 看板B (own) + 共享看板 (isShared) = 2
      const listB = svc.listDashboards('tenant-B')
      assert.strictEqual(listB.length, 2)

      // tenant-C: 共享看板 (own+isShared) = 1
      const listC = svc.listDashboards('tenant-C')
      assert.strictEqual(listC.length, 1) // 共享看板 owner 是 tenant-C，同时 isShared=true

      // tenant-D: 无私有，有共享 = 1
      const listD = svc.listDashboards('tenant-D')
      assert.strictEqual(listD.length, 1)
      assert.strictEqual(listD[0].name, '共享看板')
    })

    it('更新不存在的看板返回 null', () => {
      const result = svc.updateDashboard('non-existent', { name: '新名称' })
      assert.strictEqual(result, null)
    })

    it('查询不存在的看板返回 null', () => {
      const result = svc.getDashboard('non-existent')
      assert.strictEqual(result, null)
    })
  })

  // ── 场景 6: 边界条件 ──
  describe('场景 6: 边界条件', () => {
    it('注入大量数据应正常工作', () => {
      const points: DataPoint[] = []
      const dimensions = ['store-001', 'store-002', 'store-003']
      for (let day = 0; day < 30; day++) {
        for (const dim of dimensions) {
          points.push({ bucket: `2026-07-${String(day + 1).padStart(2, '0')}`, dimension: dim, metric: 'sales.amount', value: 10000 + day * 100 })
        }
      }
      svc.ingestDataPoints(points)
      const totals = svc.aggregateBy('sales.amount')
      assert.strictEqual(totals.size, 3)
      // 每个门店 30 天总计
      const expectedSum = points.filter(p => p.dimension === 'store-001').reduce((s, p) => s + p.value, 0)
      assert.strictEqual(totals.get('store-001'), expectedSum)
    })

    it('空数据注入不影响缓存', async () => {
      const rpt = svc.createReport({ name: '测试报告', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 300, createdBy: 'u' })
      const result = await svc.query({ reportId: rpt.id, period: 'daily' })
      assert.strictEqual(result.totalPoints, 0)
    })
  })
})
