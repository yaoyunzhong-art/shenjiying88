/**
 * store-revenue-report.service.spec.ts — 门店营收报告 Service 单元测试
 *
 * 覆盖:
 *   generateReport  — 正例(3) + 反例(1) + 边界(1)
 *   getReport       — 正例(1) + 反例(2) + 边界(1)
 *   listReports     — 正例(4) + 反例(2) + 边界(2)
 *   deleteReport    — 正例(1) + 反例(1) + 边界(1)
 *   getStoreSummary — 正例(2) + 反例(1) + 边界(1)
 *   getOverallSummary — 正例(2) + 反例(1) + 边界(1)
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置 Store 和 seeded 标志
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreRevenueReportService } from './store-revenue-report.service'

function createFreshService(): StoreRevenueReportService {
  const svc = new StoreRevenueReportService()
  svc.resetReportStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ═══════════════════════════════════════════════════════════════════
// generateReport
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · generateReport', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 生成月度报告返回完整字段', () => {
    const r = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    expect(r.id).toMatch(/^report-/)
    expect(r.storeName).toBe('深圳万象城店')
    expect(r.reportType).toBe('monthly')
    expect(r.totalRevenue).toBeGreaterThan(0)
    expect(r.totalExpense).toBeGreaterThan(0)
    expect(r.grossProfit).toBeGreaterThan(0)
    expect(r.netProfit).toBeGreaterThan(0)
    expect(r.revenueBreakdown).toBeDefined()
    expect(r.expenseBreakdown).toBeDefined()
    expect(r.tenantId).toBe(TENANT)
  })

  it('正例: 生成每日报告', () => {
    const r = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-002',
      storeName: '北京国贸店',
      startDate: '2026-07-20',
      endDate: '2026-07-20',
      reportType: 'daily',
    })
    expect(r.reportType).toBe('daily')
    expect(r.endDate).toBe(r.startDate)
  })

  it('正例: 生成季度报告，growth rate 为合理数值', () => {
    const r = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-003',
      storeName: '上海南京路店',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      reportType: 'quarterly',
    })
    expect(r.reportType).toBe('quarterly')
    expect(Number.isFinite(r.revenueGrowthRate)).toBe(true)
    expect(Number.isFinite(r.expenseGrowthRate)).toBe(true)
  })

  it('反例: 空字符串 storeId 仍可生成（不应抛异常）', () => {
    const r = service.generateReport({
      tenantId: TENANT,
      storeId: '',
      storeName: '空ID店',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      reportType: 'monthly',
    })
    expect(r).toBeDefined()
    expect(r.storeId).toBe('')
  })

  it('边界: 超大跨度的年度类型报告', () => {
    const r = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      reportType: 'monthly',
    })
    expect(r.id).toMatch(/^report-/)
    expect(r.totalRevenue).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// getReport
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · getReport', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 通过 ID 获取生成的报告', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    const found = service.getReport(created.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.id).toBe(created.id)
    expect(found!.storeName).toBe('深圳万象城店')
  })

  it('反例: 不同 tenant 无法获取报告', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    const found = service.getReport(created.id, 'tenant-other')
    expect(found).toBeUndefined()
  })

  it('反例: 不存在的报告 ID 返回 undefined', () => {
    const found = service.getReport('report-nonexistent', TENANT)
    expect(found).toBeUndefined()
  })

  it('边界: 空字符串 ID', () => {
    const found = service.getReport('', TENANT)
    expect(found).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// listReports
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · listReports', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 列出所有 tenant 的模拟报告（调用 seedMockReports）', () => {
    const reports = service.listReports(TENANT)
    expect(reports.length).toBeGreaterThanOrEqual(16)
    expect(reports.every(r => r.tenantId === TENANT)).toBe(true)
  })

  it('正例: 按 storeId 筛选', () => {
    const reports = service.listReports(TENANT, { storeId: 'store-001' })
    expect(reports.length).toBeGreaterThan(0)
    expect(reports.every(r => r.storeId === 'store-001')).toBe(true)
  })

  it('正例: 按 reportType 筛选', () => {
    const reports = service.listReports(TENANT, { reportType: 'daily' })
    expect(reports.length).toBeGreaterThan(0)
    expect(reports.every(r => r.reportType === 'daily')).toBe(true)
  })

  it('正例: 按日期范围筛选', () => {
    const reports = service.listReports(TENANT, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
    expect(reports.length).toBeGreaterThan(0)
    expect(reports.every(r => r.startDate >= '2026-07-01')).toBe(true)
    expect(reports.every(r => r.endDate <= '2026-07-31')).toBe(true)
  })

  it('反例: 不存在的 tenant 返回空数组', () => {
    const reports = service.listReports('tenant-nonexistent')
    expect(reports).toHaveLength(0)
  })

  it('反例: 不存在的 storeId 筛选返回空', () => {
    const reports = service.listReports(TENANT, { storeId: 'store-999' })
    expect(reports).toHaveLength(0)
  })

  it('边界: 空筛选条件等同无筛选', () => {
    const all = service.listReports(TENANT)
    const filtered = service.listReports(TENANT, {})
    expect(filtered).toHaveLength(all.length)
  })

  it('边界: 不存在的 reportType 筛选', () => {
    const reports = service.listReports(TENANT, { reportType: 'yearly' })
    expect(reports).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// deleteReport
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · deleteReport', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 删除已存在的报告后不可查', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '待删除',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    service.deleteReport(created.id, TENANT)
    expect(service.getReport(created.id, TENANT)).toBeUndefined()
  })

  it('反例: 删除不存在的报告抛异常', () => {
    expect(() => service.deleteReport('report-nonexistent', TENANT)).toThrow()
  })

  it('边界: 使用错误 tenant 删除抛出异常', () => {
    const created = service.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '待删除',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    expect(() => service.deleteReport(created.id, 'tenant-other')).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// getStoreSummary
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · getStoreSummary', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回门店最新报告', () => {
    const summary = service.getStoreSummary('store-001', TENANT)
    expect(summary).toBeDefined()
    expect(summary!.storeId).toBe('store-001')
    expect(summary!.totalRevenue).toBeGreaterThan(0)
  })

  it('正例: 按日期范围筛选', () => {
    const summary = service.getStoreSummary('store-001', TENANT, '2026-07-01', '2026-07-31')
    expect(summary).toBeDefined()
    expect(summary!.startDate >= '2026-07-01').toBe(true)
    expect(summary!.endDate <= '2026-07-31').toBe(true)
  })

  it('反例: 不存在的门店返回 undefined', () => {
    const summary = service.getStoreSummary('store-999', TENANT)
    expect(summary).toBeUndefined()
  })

  it('边界: 超出数据范围的日期', () => {
    const summary = service.getStoreSummary('store-001', TENANT, '2025-01-01', '2025-01-31')
    expect(summary).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// getOverallSummary
// ═══════════════════════════════════════════════════════════════════

describe('StoreRevenueReportService · getOverallSummary', () => {
  let service: StoreRevenueReportService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回总体摘要含门店数', () => {
    const summary = service.getOverallSummary(TENANT)
    expect(summary.totalRevenue).toBeGreaterThan(0)
    expect(summary.totalExpense).toBeGreaterThan(0)
    expect(summary.grossProfit).toBe(summary.totalRevenue - summary.totalExpense)
    expect(summary.netProfit).toBeGreaterThan(0)
    expect(summary.storeCount).toBeGreaterThanOrEqual(4)
  })

  it('正例: 按日期范围筛选', () => {
    const summary = service.getOverallSummary(TENANT, '2026-07-01', '2026-07-31')
    expect(summary.totalRevenue).toBeGreaterThan(0)
    expect(summary.storeCount).toBeGreaterThan(0)
  })

  it('反例: 不存在的 tenant 返回全零', () => {
    const summary = service.getOverallSummary('tenant-nonexistent')
    expect(summary.totalRevenue).toBe(0)
    expect(summary.totalExpense).toBe(0)
    expect(summary.grossProfit).toBe(0)
    expect(summary.netProfit).toBe(0)
    expect(summary.storeCount).toBe(0)
  })

  it('边界: 无匹配日期范围', () => {
    const summary = service.getOverallSummary(TENANT, '2025-01-01', '2025-01-31')
    expect(summary.totalRevenue).toBe(0)
    expect(summary.storeCount).toBe(0)
  })
})
