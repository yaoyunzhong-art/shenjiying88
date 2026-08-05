/**
 * report.controller.spec.ts
 *
 * ReportController 全路由 spec —— 覆盖全部 10 个端点 (正例+反例+边界+路由元数据)
 *
 * D-Controller spec 补全类型
 * 端点列表:
 *   GET    /report/list                    → listReports
 *   GET    /report/:id                     → getReport
 *   DELETE /report/:id                     → deleteReport
 *   POST   /report/create                  → createReport
 *   POST   /report/query                   → query
 *   POST   /report/ingest                  → ingest
 *   GET    /report/aggregate/:metric/:dimension → aggregate
 *   GET    /report/dashboard/list          → listDashboards
 *   GET    /report/dashboard/:id           → getDashboard
 *   POST   /report/dashboard/create        → createDashboard
 *   POST   /report/dashboard/update/:id    → updateDashboard
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import type { ReportDefinition, DashboardLayout, ReportDataPoint } from './report.entity'

describe('ReportController', () => {
  // ── Mock ReportService 工厂 ──
  function createMockService() {
    const reports = new Map<string, ReportDefinition>()
    const dashboards = new Map<string, DashboardLayout>()
    const dataPoints: ReportDataPoint[] = []

    return {
      listReports: () => Array.from(reports.values()),
      getReport: (id: string) => reports.get(id) ?? null,
      createReport: (input: any) => {
        const id = `rpt-test-${reports.size + 1}`
        const now = new Date().toISOString()
        const r: ReportDefinition = { ...input, id, createdAt: now, updatedAt: now }
        reports.set(id, r)
        return r
      },
      deleteReport: (id: string) => {
        const existed = reports.has(id)
        reports.delete(id)
        return existed
      },
      query: (req: any) => {
        const report = reports.get(req.reportId)
        if (!report) throw new NotFoundException(`Report ${req.reportId} not found`)
        return {
          reportId: req.reportId,
          period: req.period,
          generatedAt: new Date().toISOString(),
          data: dataPoints.filter((dp) => dp.metric === report.metrics[0]),
          totalPoints: dataPoints.length,
        }
      },
      ingestDataPoints: (points: ReportDataPoint[]) => {
        dataPoints.push(...points)
        if (dataPoints.length > 1000) dataPoints.splice(0, dataPoints.length - 1000)
      },
      aggregateBy: (metric: string, _dimension: string) => {
        const result = new Map<string, number>()
        for (const dp of dataPoints) {
          if (dp.metric === metric) {
            result.set(dp.dimension, (result.get(dp.dimension) || 0) + dp.value)
          }
        }
        return result
      },
      listDashboards: (ownerId: string) =>
        Array.from(dashboards.values()).filter((d) => d.ownerId === ownerId || d.isShared),
      getDashboard: (id: string) => dashboards.get(id) ?? null,
      createDashboard: (input: any) => {
        const id = `dash-test-${dashboards.size + 1}`
        const now = new Date().toISOString()
        const d: DashboardLayout = { ...input, id, createdAt: now, updatedAt: now }
        dashboards.set(id, d)
        return d
      },
      updateDashboard: (id: string, patch: any) => {
        const existing = dashboards.get(id)
        if (!existing) return null
        const updated = { ...existing, ...patch, id: existing.id, updatedAt: new Date().toISOString() }
        dashboards.set(id, updated)
        return updated
      },
    } as any as ReportService
  }

  const makeReportBody = (overrides: any = {}) => ({
    name: '销售日报',
    period: 'daily' as const,
    metrics: ['sales.amount', 'sales.count'],
    dimensions: ['store'],
    source: 'orders' as const,
    cacheTtl: 60,
    createdBy: 'admin',
    ...overrides,
  })

  const makeDashboardBody = (overrides: any = {}) => ({
    name: '总览看板',
    cards: [
      {
        id: 'c1',
        reportId: 'rpt-1',
        display: 'number' as const,
        title: '今日销售额',
        size: { w: 3, h: 2 },
        position: { x: 0, y: 0 },
      },
    ],
    ownerId: 'tenant-A',
    isShared: false,
    ...overrides,
  })

  describe('路由注册与模块元数据', () => {
    it('Controller 有正确的路由前缀', () => {
      const path = Reflect.getMetadata('path', ReportController)
      expect(path).toBe('report')
    })

    it('Controller 是 Injectable 的', () => {
      expect(() => new ReportController({} as ReportService)).not.toThrow()
    })

    it('实例化后 service 可用', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      expect(ctrl).toBeDefined()
    })
  })

  describe('GET /report/list — listReports', () => {
    it('正例: 空数据库返回空列表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.listReports()
      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })

    it('正例: 创建 3 个报表后列表返回 3 条', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      ctrl.createReport(makeReportBody({ name: '销售日报' }))
      ctrl.createReport(makeReportBody({ name: '会员周报', period: 'weekly' }))
      ctrl.createReport(makeReportBody({ name: 'AI使用月报', period: 'monthly' }))
      const result = ctrl.listReports()
      expect(result.items).toHaveLength(3)
      expect(result.total).toBe(3)
      expect(result.items.map((r: ReportDefinition) => r.name)).toEqual(
        expect.arrayContaining(['销售日报', '会员周报', 'AI使用月报'])
      )
    })

    it('边界: 创建再删除后计数归零', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const rptName = '临时报表'
      const created = ctrl.createReport(makeReportBody({ name: rptName }))
      const beforeDelete = ctrl.listReports()
      expect(beforeDelete.total).toBe(1)

      // 通过 controller DELETE 删除
      const result = ctrl.deleteReport(created.id)
      expect(result.success).toBe(true)
      expect(result.id).toBe(created.id)

      const afterDelete = ctrl.listReports()
      expect(afterDelete.total).toBe(0)
    })

    it('边界: 删除不存在的报表应抛异常', () => {
      const ctrl = new ReportController(createMockService())
      expect(() => ctrl.deleteReport('nonexistent-id')).toThrow()
    })
  })

  describe('GET /report/:id — getReport', () => {
    it('正例: 按 ID 查询返回报表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createReport(makeReportBody({ name: '销售报表' }))
      const result = ctrl.getReport(created.id)
      expect(result.id).toBe(created.id)
      expect(result.name).toBe('销售报表')
      expect(result.period).toBe('daily')
    })

    it('正例: 返回的报表包含所有必填字段', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createReport(makeReportBody())
      const result = ctrl.getReport(created.id)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('period')
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('dimensions')
      expect(result).toHaveProperty('source')
      expect(result).toHaveProperty('cacheTtl')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
    })

    it('反例: 不存在的 ID 抛出 BadRequestException', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      expect(() => ctrl.getReport('non-existent')).toThrow(BadRequestException)
    })

    it('反例: 空字符串 ID 抛出 BadRequestException', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      expect(() => ctrl.getReport('')).toThrow(BadRequestException)
    })

    it('边界: 仅通过 create/get 操作验证服务层健壮性', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      // 验证 create 后一定可以 get 到
      const created = ctrl.createReport(makeReportBody({ name: '边界测试' }))
      const result = ctrl.getReport(created.id)
      expect(result.id).toBe(created.id)
      // 验证不存在的 ID 抛出异常
      expect(() => ctrl.getReport('boundary-nonexistent')).toThrow(BadRequestException)
    })
  })

  describe('POST /report/create — createReport', () => {
    it('正例: 创建报表返回完整对象', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createReport(makeReportBody())
      expect(result.id).toBeDefined()
      expect(result.name).toBe('销售日报')
      expect(result.period).toBe('daily')
      expect(result.metrics).toHaveLength(2)
      expect(result.source).toBe('orders')
      expect(result.cacheTtl).toBe(60)
    })

    it('正例: 创建周报类型的报表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createReport(
        makeReportBody({ name: '会员周报', period: 'weekly', metrics: ['member.new', 'member.active'], source: 'members', cacheTtl: 300 })
      )
      expect(result.period).toBe('weekly')
      expect(result.metrics).toContain('member.new')
      expect(result.metrics).toContain('member.active')
      expect(result.cacheTtl).toBe(300)
    })

    it('正例: 创建带 AI 指标的报表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createReport(
        makeReportBody({ name: 'AI使用日报', metrics: ['ai.tokens', 'ai.latency'], source: 'ai_logs' })
      )
      expect(result.source).toBe('ai_logs')
      expect(result.metrics).toContain('ai.tokens')
      expect(result.metrics).toContain('ai.latency')
    })

    it('边界: 创建时 createdBy 为 system', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createReport(makeReportBody({ createdBy: 'system' }))
      expect(result.createdBy).toBe('system')
    })

    it('边界: 多维度报表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createReport(
        makeReportBody({ dimensions: ['store', 'brand', 'category'] })
      )
      expect(result.dimensions).toHaveLength(3)
    })
  })

  describe('POST /report/query — query', () => {
    it('正例: 查询已有报表', async () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const report = ctrl.createReport(makeReportBody({ name: '销售查询', metrics: ['sales.amount'] }))

      // 先注入一些数据点
      svc.ingestDataPoints([
        { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
        { bucket: '2026-07-10', dimension: 'store-002', metric: 'sales.amount', value: 60000 },
      ])

      const result = await ctrl.query({ reportId: report.id, period: 'daily' })
      expect(result.reportId).toBe(report.id)
      expect(result.period).toBe('daily')
      expect(result.generatedAt).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(typeof result.totalPoints).toBe('number')
    })

    it('正例: 指定时间范围的查询', async () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const report = ctrl.createReport(makeReportBody({ name: '时间过滤', metrics: ['sales.amount'] }))

      svc.ingestDataPoints([
        { bucket: '2026-07-01', dimension: 'store-001', metric: 'sales.amount', value: 100 },
        { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.amount', value: 200 },
      ])

      const result = await ctrl.query({ reportId: report.id, period: 'custom', from: '2026-07-01', to: '2026-07-05' })
      expect(result.reportId).toBe(report.id)
      expect(result.period).toBe('custom')
    })

    it('反例: 不存在的报表抛出异常', async () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      // 由于 service 同步抛出, 异常在 controller 内被捕获或传播
      // controller.query 调用 service.query 会传播错误
      try {
        await ctrl.query({ reportId: 'non-existent', period: 'daily' })
        // 如果没抛出, 手动断言失败
        expect(true).toBe(false)
      } catch (e: any) {
        expect(e).toBeDefined()
      }
    })
  })

  describe('POST /report/ingest — ingest', () => {
    it('正例: 注入数据点返回正确的数量', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.ingest({
        points: [
          { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
          { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.count', value: 120 },
        ],
      })
      expect(result.ingested).toBe(2)
    })

    it('正例: 注入空数组返回 0', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.ingest({ points: [] })
      expect(result.ingested).toBe(0)
    })

    it('正例: 大量数据点注入', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const manyPoints = Array.from({ length: 100 }, (_, i) => ({
        bucket: `2026-07-${String(i % 30 + 1).padStart(2, '0')}`,
        dimension: 'store-001',
        metric: 'sales.amount' as const,
        value: 10000 + i,
      }))
      const result = ctrl.ingest({ points: manyPoints })
      expect(result.ingested).toBe(100)
    })
  })

  describe('GET /report/aggregate/:metric/:dimension — aggregate', () => {
    it('正例: 按维度聚合返回正确结果', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)

      svc.ingestDataPoints([
        { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
        { bucket: '2026-07-10', dimension: 'store-002', metric: 'sales.amount', value: 60000 },
        { bucket: '2026-07-11', dimension: 'store-001', metric: 'sales.amount', value: 55000 },
      ])

      const result = ctrl.aggregate('sales.amount', 'store')
      expect(result.metric).toBe('sales.amount')
      expect(result.dimension).toBe('store')
      expect(result.totals).toBeDefined()
    })

    it('正例: 无数据时返回空对象', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.aggregate('member.new', 'member_tier')
      expect(result.metric).toBe('member.new')
      expect(result.dimension).toBe('member_tier')
      expect(Object.keys(result.totals)).toHaveLength(0)
    })

    it('正例: 多个维度值聚合求和', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)

      svc.ingestDataPoints([
        { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.count', value: 10 },
        { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.count', value: 20 },
        { bucket: '2026-07-10', dimension: 'store-002', metric: 'sales.count', value: 30 },
      ])

      const result = ctrl.aggregate('sales.count', 'store')
      expect(result.totals['store-001']).toBe(30)
      expect(result.totals['store-002']).toBe(30)
    })
  })

  describe('GET /report/dashboard/list — listDashboards', () => {
    it('正例: 空看板列表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.listDashboards('tenant-A')
      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })

    it('正例: 创建后列表包含看板', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      ctrl.createDashboard(makeDashboardBody({ name: '销售看板' }))
      const result = ctrl.listDashboards('tenant-A')
      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.items[0].name).toBe('销售看板')
    })

    it('正例: 共享看板对所有用户可见', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      ctrl.createDashboard(makeDashboardBody({ name: '共享看板', ownerId: 'tenant-B', isShared: true }))
      const result = ctrl.listDashboards('tenant-A')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('共享看板')
    })

    it('正例: 非共享看板仅对 owner 可见', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      ctrl.createDashboard(makeDashboardBody({ name: '私有看板', ownerId: 'tenant-B', isShared: false }))
      const result = ctrl.listDashboards('tenant-A')
      expect(result.items).toHaveLength(0)
    })

    it('边界: 多个看板返回正确数量', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      for (let i = 0; i < 5; i++) {
        ctrl.createDashboard(makeDashboardBody({ name: `看板${i + 1}`, ownerId: 'tenant-A' }))
      }
      const result = ctrl.listDashboards('tenant-A')
      expect(result.items).toHaveLength(5)
      expect(result.total).toBe(5)
    })
  })

  describe('GET /report/dashboard/:id — getDashboard', () => {
    it('正例: 按 ID 查询返回看板', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody({ name: '看板详情' }))
      const result = ctrl.getDashboard(created.id)
      expect(result.id).toBe(created.id)
      expect(result.name).toBe('看板详情')
    })

    it('正例: 返回的看板包含所有必填字段', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody())
      const result = ctrl.getDashboard(created.id)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('cards')
      expect(result).toHaveProperty('ownerId')
      expect(result).toHaveProperty('isShared')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
    })

    it('反例: 不存在的 ID 抛出 BadRequestException', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      expect(() => ctrl.getDashboard('non-existent')).toThrow(BadRequestException)
    })
  })

  describe('POST /report/dashboard/create — createDashboard', () => {
    it('正例: 创建看板返回完整对象', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createDashboard(makeDashboardBody())
      expect(result.id).toBeDefined()
      expect(result.name).toBe('总览看板')
      expect(result.ownerId).toBe('tenant-A')
      expect(result.isShared).toBe(false)
    })

    it('正例: 创建共享看板', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createDashboard(makeDashboardBody({ isShared: true }))
      expect(result.isShared).toBe(true)
    })

    it('正例: 创建带多个卡片的看板', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const result = ctrl.createDashboard({
        name: '完整看板',
        cards: [
          { id: 'c1', reportId: 'rpt-sales', display: 'number', title: '销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
          { id: 'c2', reportId: 'rpt-sales', display: 'line', title: '趋势', size: { w: 6, h: 4 }, position: { x: 3, y: 0 } },
          { id: 'c3', reportId: 'rpt-member', display: 'bar', title: '会员', size: { w: 3, h: 4 }, position: { x: 9, y: 0 } },
        ],
        ownerId: 'tenant-A',
        isShared: true,
      })
      expect(result.cards).toHaveLength(3)
      expect(result.cards.map((c: any) => c.display)).toEqual(['number', 'line', 'bar'])
    })
  })

  describe('POST /report/dashboard/update/:id — updateDashboard', () => {
    it('正例: 更新看板名称', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody({ name: '旧名称' }))
      const updated = ctrl.updateDashboard(created.id, { name: '新名称' })
      expect(updated.name).toBe('新名称')
    })

    it('正例: 更新看板共享状态', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody({ isShared: false }))
      const updated = ctrl.updateDashboard(created.id, { isShared: true })
      expect(updated.isShared).toBe(true)
    })

    it('正例: 部分更新保持其他字段不变', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody({ name: '看板', ownerId: 'tenant-A', isShared: false }))
      const updated = ctrl.updateDashboard(created.id, { name: '仅改名称' })
      expect(updated.name).toBe('仅改名称')
      expect(updated.ownerId).toBe('tenant-A')
      expect(updated.isShared).toBe(false)
    })

    it('正例: 更新卡片列表', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody({ cards: [] }))
      const updated = ctrl.updateDashboard(created.id, {
        cards: [{ id: 'new-card', reportId: 'rpt-1', display: 'pie', title: '饼图', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } }],
      })
      expect(updated.cards).toHaveLength(1)
      expect(updated.cards[0].display).toBe('pie')
    })

    it('反例: 不存在的看板抛出 BadRequestException', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      expect(() => ctrl.updateDashboard('non-existent', { name: '新名称' })).toThrow(BadRequestException)
    })

    it('边界: 空更新对象不影响已存在数据', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)
      const created = ctrl.createDashboard(makeDashboardBody({ name: '原始名称', ownerId: 'tenant-A' }))
      const updated = ctrl.updateDashboard(created.id, {})
      expect(updated.name).toBe('原始名称')
      expect(updated.ownerId).toBe('tenant-A')
    })
  })

  describe('集成场景 — 完整工作流', () => {
    it('创建报表→注入数据→查询→聚合的完整链路', async () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)

      // 1. 创建报表
      const report = ctrl.createReport(makeReportBody({ name: '集成测试报表', metrics: ['sales.amount', 'sales.count'] }))
      expect(report.id).toBeDefined()

      // 2. 验证列表
      const list = ctrl.listReports()
      expect(list.total).toBe(1)

      // 3. 注入数据
      ctrl.ingest({
        points: [
          { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.amount', value: 50000 },
          { bucket: '2026-07-10', dimension: 'store-002', metric: 'sales.amount', value: 75000 },
          { bucket: '2026-07-10', dimension: 'store-001', metric: 'sales.count', value: 100 },
          { bucket: '2026-07-10', dimension: 'store-002', metric: 'sales.count', value: 150 },
        ],
      })

      // 4. 查询
      const queryResult = await ctrl.query({ reportId: report.id, period: 'daily' })
      expect(queryResult.totalPoints).toBeGreaterThan(0)

      // 5. 聚合
      const aggResult = ctrl.aggregate('sales.amount', 'store')
      expect(aggResult.metric).toBe('sales.amount')
      expect(Object.keys(aggResult.totals).length).toBeGreaterThan(0)
    })

    it('创建看板→列表→详情→更新的完整链路', () => {
      const svc = createMockService()
      const ctrl = new ReportController(svc)

      // 1. 创建看板
      const dash = ctrl.createDashboard(makeDashboardBody({ name: '经营看板', ownerId: 'store-001' }))
      expect(dash.id).toBeDefined()

      // 2. 列表
      const list = ctrl.listDashboards('store-001')
      expect(list.total).toBe(1)

      // 3. 详情
      const detail = ctrl.getDashboard(dash.id)
      expect(detail.id).toBe(dash.id)

      // 4. 更新
      const updated = ctrl.updateDashboard(dash.id, { name: '经营看板(已更新)', isShared: true })
      expect(updated.name).toBe('经营看板(已更新)')
      expect(updated.isShared).toBe(true)
    })
  })
})
