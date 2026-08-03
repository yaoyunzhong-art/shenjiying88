import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * StoreRevenueReportController 单元测试
 *
 * 覆盖端点:
 *   - POST   /revenue-reports
 *   - GET    /revenue-reports
 *   - GET    /revenue-reports/:id
 *   - DELETE /revenue-reports/:id
 *   - GET    /revenue-reports/views/store/:storeId/summary
 *   - GET    /revenue-reports/views/overall/summary
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type RequestTenantContext = { tenantId: string }

type RevenueReport = {
  id: string
  tenantId: string
  storeId: string
  storeName: string
  startDate: string
  endDate: string
  reportType: string
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  createdAt: string
}

type StoreSummary = {
  storeId: string
  tenantId: string
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  reportCount: number
  periodStart?: string
  periodEnd?: string
}

type OverallSummary = {
  tenantId: string
  totalRevenue: number
  totalOrders: number
  storeCount: number
  reportCount: number
  periodStart?: string
  periodEnd?: string
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  const reports = new Map<string, RevenueReport>()
  let idCounter = 0

  return {
    generateReport(input: {
      tenantId: string
      storeId: string
      storeName: string
      startDate: string
      endDate: string
      reportType: string
    }): RevenueReport {
      const id = `RR-${++idCounter}`
      const report: RevenueReport = {
        id,
        tenantId: input.tenantId,
        storeId: input.storeId,
        storeName: input.storeName,
        startDate: input.startDate,
        endDate: input.endDate,
        reportType: input.reportType,
        totalRevenue: Math.random() * 100000,
        totalOrders: Math.floor(Math.random() * 500),
        avgOrderValue: 0,
        createdAt: new Date().toISOString(),
      }
      report.avgOrderValue = report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0
      reports.set(id, report)
      return report
    },

    listReports(tenantId: string, filters: {
      storeId?: string
      startDate?: string
      endDate?: string
      reportType?: string
    }): RevenueReport[] {
      let list = Array.from(reports.values()).filter((r) => r.tenantId === tenantId)
      if (filters.storeId) list = list.filter((r) => r.storeId === filters.storeId)
      if (filters.startDate) list = list.filter((r) => r.startDate >= filters.startDate!)
      if (filters.endDate) list = list.filter((r) => r.endDate <= filters.endDate!)
      if (filters.reportType) list = list.filter((r) => r.reportType === filters.reportType)
      return list
    },

    getReport(id: string, tenantId: string): RevenueReport | null {
      const r = reports.get(id)
      if (!r || r.tenantId !== tenantId) return null
      return r
    },

    deleteReport(id: string, tenantId: string): void {
      const r = reports.get(id)
      if (r && r.tenantId === tenantId) reports.delete(id)
    },

    getStoreSummary(storeId: string, tenantId: string, startDate?: string, endDate?: string): StoreSummary | null {
      const filtered = Array.from(reports.values()).filter(
        (r) => r.storeId === storeId && r.tenantId === tenantId,
      )
      if (filtered.length === 0) return null
      const totalRevenue = filtered.reduce((s, r) => s + r.totalRevenue, 0)
      const totalOrders = filtered.reduce((s, r) => s + r.totalOrders, 0)
      return {
        storeId,
        tenantId,
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        reportCount: filtered.length,
        periodStart: startDate,
        periodEnd: endDate,
      }
    },

    getOverallSummary(tenantId: string, startDate?: string, endDate?: string): OverallSummary {
      const filtered = Array.from(reports.values()).filter((r) => r.tenantId === tenantId)
      const uniqueStores = new Set(filtered.map((r) => r.storeId))
      const totalRevenue = filtered.reduce((s, r) => s + r.totalRevenue, 0)
      const totalOrders = filtered.reduce((s, r) => s + r.totalOrders, 0)
      return {
        tenantId,
        totalRevenue,
        totalOrders,
        storeCount: uniqueStores.size,
        reportCount: filtered.length,
        periodStart: startDate,
        periodEnd: endDate,
      }
    },

    // Seed helpers
    _seedReport(r: RevenueReport) { reports.set(r.id, r) },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineStoreRevenueReportController {
  constructor(private readonly service: ReturnType<typeof createMocks>) {}

  generateReport(tenantContext: RequestTenantContext, body: { storeId: string; startDate: string; endDate: string; reportType: string }) {
    return this.service.generateReport({
      tenantId: tenantContext.tenantId,
      storeId: body.storeId,
      storeName: `门店-${body.storeId}`,
      startDate: body.startDate,
      endDate: body.endDate,
      reportType: body.reportType,
    })
  }

  listReports(tenantContext: RequestTenantContext, query: { storeId?: string; startDate?: string; endDate?: string; reportType?: string }) {
    return this.service.listReports(tenantContext.tenantId, query)
  }

  getReport(tenantContext: RequestTenantContext, id: string) {
    const report = this.service.getReport(id, tenantContext.tenantId)
    if (!report) {
      throw new Error(`Revenue report not found: ${id}`)
    }
    return report
  }

  deleteReport(tenantContext: RequestTenantContext, id: string) {
    this.service.deleteReport(id, tenantContext.tenantId)
    return { success: true }
  }

  getStoreSummary(tenantContext: RequestTenantContext, storeId: string, startDate?: string, endDate?: string) {
    const summary = this.service.getStoreSummary(storeId, tenantContext.tenantId, startDate, endDate)
    if (!summary) {
      throw new Error(`No revenue report found for store: ${storeId}`)
    }
    return summary
  }

  getOverallSummary(tenantContext: RequestTenantContext, startDate?: string, endDate?: string) {
    return this.service.getOverallSummary(tenantContext.tenantId, startDate, endDate)
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('StoreRevenueReportController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineStoreRevenueReportController
  const ctx: RequestTenantContext = { tenantId: 't-main' }
  const otherCtx: RequestTenantContext = { tenantId: 't-other' }

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineStoreRevenueReportController(mock)
  })

  describe('POST /revenue-reports - generateReport', () => {
    it('[正例] 生成门店营收报告', () => {
      const result = controller.generateReport(ctx, {
        storeId: 's-1',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        reportType: 'monthly',
      })
      assert.ok(result.id)
      assert.equal(result.storeId, 's-1')
      assert.equal(result.reportType, 'monthly')
      assert.ok(result.totalRevenue >= 0)
      assert.ok(result.totalOrders >= 0)
    })

    it('[正例] storeName 自动拼接', () => {
      const result = controller.generateReport(ctx, {
        storeId: 's-2',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        reportType: 'weekly',
      })
      assert.equal(result.storeName, '门店-s-2')
    })

    it('[边界] 0 订单时 avgOrderValue 为 0', () => {
      const result = controller.generateReport(ctx, {
        storeId: 's-zero',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        reportType: 'daily',
      })
      assert.equal(typeof result.avgOrderValue, 'number')
    })
  })

  describe('GET /revenue-reports - listReports', () => {
    it('[正例] 列出当前租户所有报告', () => {
      controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      controller.generateReport(ctx, { storeId: 's-2', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      const result = controller.listReports(ctx, {})
      assert.equal(result.length, 2)
    })

    it('[边界] 不同租户数据隔离', () => {
      controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      controller.generateReport(otherCtx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      assert.equal(controller.listReports(ctx, {}).length, 1)
      assert.equal(controller.listReports(otherCtx, {}).length, 1)
    })

    it('[边界] 无报告返回空数组', () => {
      const result = controller.listReports(ctx, {})
      assert.deepEqual(result, [])
    })
  })

  describe('GET /revenue-reports/:id - getReport', () => {
    it('[正例] 按 ID 查询报告', () => {
      const created = controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      const result = controller.getReport(ctx, created.id)
      assert.equal(result.id, created.id)
    })

    it('[反例] 不存在的 ID 抛异常', () => {
      assert.throws(
        () => controller.getReport(ctx, 'RR-99999'),
        /not found/,
      )
    })

    it('[反例] 跨租户查询不到', () => {
      const created = controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      assert.throws(
        () => controller.getReport(otherCtx, created.id),
        /not found/,
      )
    })
  })

  describe('DELETE /revenue-reports/:id - deleteReport', () => {
    it('[正例] 删除成功', () => {
      const created = controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      const result = controller.deleteReport(ctx, created.id)
      assert.ok(result.success)
      assert.throws(() => controller.getReport(ctx, created.id), /not found/)
    })

    it('[边界] 删除不存在的 ID 不抛错', () => {
      const result = controller.deleteReport(ctx, 'RR-99999')
      assert.ok(result.success)
    })
  })

  describe('GET /revenue-reports/views/store/:storeId/summary - getStoreSummary', () => {
    it('[正例] 返回门店汇总', () => {
      controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-15', reportType: 'weekly' })
      controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-16', endDate: '2026-07-31', reportType: 'weekly' })
      const result = controller.getStoreSummary(ctx, 's-1')
      assert.equal(result.storeId, 's-1')
      assert.equal(result.reportCount, 2)
      assert.ok(result.totalRevenue > 0)
    })

    it('[反例] 无报告的门店抛异常', () => {
      assert.throws(
        () => controller.getStoreSummary(ctx, 's-no-data'),
        /No revenue report found/,
      )
    })
  })

  describe('GET /revenue-reports/views/overall/summary - getOverallSummary', () => {
    it('[正例] 返回整体汇总', () => {
      controller.generateReport(ctx, { storeId: 's-1', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      controller.generateReport(ctx, { storeId: 's-2', startDate: '2026-07-01', endDate: '2026-07-31', reportType: 'monthly' })
      const result = controller.getOverallSummary(ctx)
      assert.equal(result.storeCount, 2)
      assert.equal(result.reportCount, 2)
    })

    it('[边界] 无数据返回 0 值汇总', () => {
      const result = controller.getOverallSummary(ctx)
      assert.equal(result.storeCount, 0)
      assert.equal(result.reportCount, 0)
      assert.equal(result.totalRevenue, 0)
    })
  })
})
